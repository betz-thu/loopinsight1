/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/
import NotImplementedError from '../common/NotImplementedError'


// base class of controller algorithm
abstract class AbstractController {

	protected patient: object
	protected announcedCarbs: (t: number) => number

	/**
	 * sets the virtual patient
	 * @param {object} patient 
	 */
	setPatient(patient: object) {
		this.patient = patient
	}

	/**
	 * Callback for computing the amount of announced
	 * carbs at a specific point in time.
	 * 
	 * @callback announcedCarbs 
	 * @param {number} t - the time of interest
	 * @returns {number}
	 */
	/**
	 * Set a callback that determines the amount of announced
	 * carbs at a specific point in time.
	 * 
	 * @param {announcedCarbs} announcedCarbs 
	 */
	setAnnouncedCarbs(announcedCarbs: (t: number) => number) {
		this.announcedCarbs = announcedCarbs
	}

	/**
	 * reset controller (before simulation run)
	 */
	abstract reset(): void

	/**
	 * computes insulin demand
	 * 
	 * @param {number} t - TODO
	 * @param {object} y - TODO
	 * @param {number} x - TODO
	 * @returns {{iir: number, ibolus: number, logData?: object}} - TODO
	 */
	abstract computeTreatment(t: number, y: object, x: number): { iir: number; ibolus: number; logData?: object }
}

export default AbstractController;
