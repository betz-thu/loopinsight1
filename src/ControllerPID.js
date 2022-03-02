/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


import Controller from './Controller.js';

class ControllerPID extends Controller {
		
	constructor() {
		super();
		this.setParams(1, false, 0, 0); 
	};
	
	setParams(basalRate, kP, kI, kD, target, useBolus, PreBolusTime, CarbFactor) {
		this.IIReq = basalRate;
		this.kP = kP;
		this.kI = kI;
		this.kD = kD;
		this.target = target;
		this.useBolus = useBolus;
		this.PreBolusTime = PreBolusTime;	// time between meal and bolus
		this.CarbFactor = CarbFactor;		// insulin units per 10g CHO
	};
	
	// reset before new simulation
	setup(patient) {
		super.setup(patient);
		this.e_int = 0;
		this.e_old = undefined;
		this.IIR = this.IIReq;
	};
	
	// compute insulin demand
	update(t, y, _x, announcement) {
		super.update();
		
		// compute bolus (IIR remains constant all the time)
		this.bolus = this.useBolus * announcement(t+this.PreBolusTime) / 10.0 
			* this.CarbFactor;
		
		// PID law
		let e = this.target - y.G;
		this.e_int += e / 60;
		
		let u = this.IIReq - this.kP * e - this.kI * this.e_int;
		if (typeof this.e_old !== "undefined") {
			u -= this.kD * (e - this.e_old) * 60;
		}
		this.e_old = e;
		
		this.IIR = u;		
		return {};
	};
	
	// return current treatment
	getTreatment() {
		return {
			iir: this.IIR,
			ibolus: this.bolus,
		};
	};
	
}

export default ControllerPID;