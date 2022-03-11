/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

import AbstractController from './AbstractController'

import determine_basal from 'oref0/lib/determine-basal/determine-basal.js'
import tempBasalFunctions from 'oref0/lib/basal-set-temp.js'
import iob from 'oref0/lib/iob/index.js'
import getMealData from 'oref0/lib/meal/total.js'

// redirect console outputs of determine-basal and store them
var debugLog = "";

// Socket.write(buffer: string | Uint8Array, cb?: (err?: Error) => void): boolean

var log_fun = function (params: string | any[] | Object) {

	let args: any[]
	if (typeof params === 'object') {
		args = Object.values(arguments);
	}
	else {
		args = [arguments];
	}

	for (const arg of args) {
		if (typeof arg === "string") {
			debugLog = debugLog + arg.trim() + " ";
		}
		else if (typeof arg === "object") {
			debugLog = debugLog + JSON.stringify(arg) + ";";
		}
		else {
			debugLog = debugLog + JSON.stringify(arg);
		}
	}
	debugLog = debugLog + ";";
}


class ControllerOref0 extends AbstractController {

	profile: { [key: string]: any; }; // TODO define type
	useBolus: boolean;
	PreBolusTime: number;
	CarbFactor: number;
	t0: number;
	currenttemp: { duration: number; rate: number; temp: string; _type?: string; timestamp?: Date; 'duration (min)'?: number; }
	treatmentHistory: any[];
	glucoseHistory: any[];
	hist: any[];
	ibolus: number;
	IIR: any;
	bolus: number;
	patient: any;

	constructor(profile: { [key: string]: any }, useBolus: boolean, PreBolusTime: number, CarbFactor: number) {

		super()

		// patient profile
		// todo: create default profile
		//profile = Object.assign(oref0Profile.defaults(), profile);
		this.profile = profile;
		this.profile.type = "current";
		this.profile.min_5m_carbimpact = 12;
		this.profile.isfProfile = {
			sensitivities: [
				{ offset: 0, sensitivity: 100 }
			]
		}

		// manual pre-bolus setup
		this.useBolus = useBolus;
		this.PreBolusTime = PreBolusTime; 	// time between meal and bolus
		this.CarbFactor = CarbFactor;		// insulin units per 10g CHO
	}


	// reset and initialize
	reset() {
		this.t0 = new Date().valueOf();

		// default basal rate
		this.currenttemp = {
			_type: "Temp Basal",
			timestamp: new Date(this.t0),
			duration: 5,
			'duration (min)': 5,
			rate: 0,
			temp: "absolute"
		};
		this.treatmentHistory = [this.currenttemp];

		// clear glucose measurement history
		this.glucoseHistory = [];
		this.hist = [];

		// reset treatment
		this.ibolus = 0;
		this.IIR = this.currenttemp.rate;
	}


	/**
	 * computes insulin demand
	 * 
	 * @param {number} t - TODO
	 * @param {number} y - TODO
	 * @param {number} _x - TODO
	 * @returns {{iir: number, ibolus: number, logData: Object}} - TODO
	 */
	computeTreatment(t: number, y: { [x: string]: any; }, _x: any): { iir: number; ibolus: number; logData?: object; } {

		let tNow = new Date(this.t0 + t * 60 * 1000);
		let G = y.G;

		// add current glucose measurement to history
		this.hist[t] = G;

		// compute (simulated manual) bolus
		if (this.useBolus) {
			this.bolus = this.CarbFactor * this.announcedCarbs(t + this.PreBolusTime) / 10.0
			this.treatmentHistory.push({
				_type: "Bolus",
				timestamp: tNow.toISOString(),	// todo : required?
				amount: this.bolus,				// todo : required?
				insulin: this.bolus,
				date: tNow,						// todo : required?
				dateString: tNow.toISOString(),	// todo : required?
				started_at: tNow,				// todo : required?
			})
		} else {
			this.bolus = 0
		}

		// memorize meals
		let meal = this.announcedCarbs(t);
		if (meal > 0) {
			this.treatmentHistory.push({
				_type: "carbs",
				timestamp: tNow.toISOString(),
				carbs: meal,
				nsCarbs: meal,
			})
		}

		// run only every 5 minutes
		if (t % 5) {
			return { iir: this.IIR, ibolus: this.bolus };
		}

		// add current glucose measurement to history
		this.glucoseHistory.unshift({
			date: tNow,
			dateString: tNow.toISOString(),
			glucose: G
		});


		// add effect of current temp (5min) to treatment history (->IOB)
		this.treatmentHistory.push({
			_type: "Temp Basal",
			eventType: "Temp Basal",
			rate: (this.IIR - this.patient.IIReq),
			date: tNow.valueOf() - 5 * 60 * 1000,
			timestamp: new Date(tNow.valueOf() - 5 * 60 * 1000),
			insulin: 5 / 60 * (this.IIR - this.patient.IIReq),
		})


		// compute glucose trends
		// todo: check if these formulas are correct
		let glucose_status = {
			"glucose": G,
			"date": tNow,
			"delta": 0,
			"short_avgdelta": 0,
			"long_avgdelta": 0,
		}
		if (t >= 5) {
			glucose_status["delta"] = G - this.hist[t - 5]
		}
		if (t >= 15) {
			glucose_status["short_avgdelta"] = (G - this.hist[t - 15]) / 3.0;
		}
		if (t >= 45) {
			glucose_status["long_avgdelta"] = (G - this.hist[t - 45]) / 9.0;
		}


		// redirect console outputs to capture them
		debugLog = "";
		process.stderr.write = log_fun as any


		// configure autosens
		let autosens = { ratio: 1.0 };	// todo


		// compute IOB based on temp and bolus history
		let iob_data = iob(
			{
				profile: this.profile,
				clock: tNow,
			},
			false,
			this.treatmentHistory,
		);


		// compute meal data
		let opts = {
			treatments: this.treatmentHistory,
			profile: this.profile,
			pumphistory: this.treatmentHistory,		// -> total.js / iob_inputs
			glucose: this.glucoseHistory,
			basalprofile: {
				basals: [
					{ minutes: 0, rate: 1 }	// todo
				]
			}
		};

		let meal_data = getMealData(opts, tNow);	// -> total.js

		// not sure why this is necessary; the entry seems to be overwritten??
		this.profile.current_basal = Number(this.patient.IIReq);

		// call determine-basal
		let basal = determine_basal(glucose_status,
			this.currenttemp,
			iob_data,
			this.profile,
			autosens,
			meal_data,
			tempBasalFunctions,
			false,
			undefined,
			tNow);

		// store bg prediction for interactive visualization
		let predBG = [];
		if (typeof basal.predBGs !== "undefined") {
			if (typeof basal.predBGs.COB !== "undefined") {
				// if prediction based on COB is available, use it
				predBG = basal.predBGs.COB;
			}
			else if (typeof basal.predBGs.IOB !== "undefined") {
				// otherwise, use prediction based on IOB
				predBG = basal.predBGs.IOB;
			}
		}

		basal.predictedBG = [];
		for (let i = 0; i < predBG.length; i++) {
			basal.predictedBG.push({ t: t + 5 * i, BG: predBG[i] });
		}

		// prepare outputs
		if (typeof basal.rate !== 'undefined') {
			// remember new temp
			this.currenttemp = {
				duration: basal.duration,
				rate: basal.rate,
				temp: "absolute"
			}

			this.IIR = basal.rate;
		} else {
			// todo: check if current temp is still active
			// otherwise, return to default
		}

		// store console outputs of determine-basal
		const logData = { ...basal }
		logData.debug = debugLog.split(";").map(s => s.trim()).filter(s => s.length != 0);
		logData.reason = logData.reason.split(/[,;]/).map((s: string) => s.trim());

		return { iir: this.IIR, ibolus: this.bolus, logData }
	}


}

export default ControllerOref0;
