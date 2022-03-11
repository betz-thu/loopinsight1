/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


import AbstractController from './AbstractController';

class ControllerBasalBolus extends AbstractController {

	private IIR: number
	private useBolus: boolean
	private preBolusTime: number
	private carbFactor: number

	private bolus: number

	constructor() {
		super()
		this.setParams(1, false, 0, 0)
	}

	setParams(basalRate: number, useBolus: boolean, preBolusTime: number, carbFactor: number) {
		this.IIR = basalRate
		this.useBolus = useBolus
		this.preBolusTime = preBolusTime	// time between meal and bolus
		this.carbFactor = carbFactor		// insulin units per 10g CHO
	}

	// reset before new simulation
	reset() {
		// nothing to do
	}

	/**
	 * computes insulin demand
	 * 
	 * @param {number} t - TODO
	 * @param {object} _y - TODO
	 * @param {number} _x - TODO
	 * @returns {{iir: number, ibolus: number, logData: object}} - TODO
	 */
	computeTreatment(t: number, _y: object, _x: number): { iir: number; ibolus: number; logData?: object; } {
		// compute bolus (IIR remains constant all the time)
		this.bolus = this.useBolus ?
			this.announcedCarbs(t + this.preBolusTime) / 10.0 * this.carbFactor
			: 0

		return { iir: this.IIR, ibolus: this.bolus}
	}


}

export default ControllerBasalBolus;
