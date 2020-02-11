import { Map } from 'immutable';
import { Store } from 'flux/utils';
import dispatcher from '../util/dispatcher';
import { types } from '../actions/report';


class AnnualReportStore extends Store {
  constructor(_dispatcher) {
    super(_dispatcher);

    this.state = {
      reports: new Map(),
    };
  }

  getState() {
    return this.state;
  }

  /**
   * Gets a report by id from the data store.
   *
   * @param {string} reportId
   *   The report id from the jsonapi data.
   * @returns {Map | boolean}
   *   A Map containing the report data from the api or false if it doesn't not exist.
   */
  getReport(reportId) {
    return this.state.reports.get(reportId) || false;
  }

  /**
   * Get a report's agency abbreviation by report id.
   *
   * @param {string} reportId
   *   The report id from the jsonapi data.
   * @returns {boolean|string}
   *   The reporting agency's abbreviation or false, if the agency or abbreviation cannot be found.
   */
  getAgency(reportId) {
    const report = this.getReport(reportId);
    if (!report) {
      return false;
    }

    return report.get('field_agency') && report.get('field_agency').abbreviation
      ? report.get('field_agency').abbreviation
      : false;
  }

  /**
   * Get a report's fiscal year by report id.
   *
   * @param {string} reportId
   *   The report id from the jsonapi data.
   * @returns {boolean|string}
   *   The fiscal year of the report or false if the data cannot be found.
   */
  getFiscalYear(reportId) {
    const report = this.getReport(reportId);
    return report && report.get('field_foia_annual_report_yr') ? report.get('field_foia_annual_report_yr') : false;
  }

  /**
   * Get a dataType's agency component abbreviation.
   *
   * @param {Object} dataType
   *   The section or object containing the agency component field.
   * @returns {boolean|string}
   *   The component abbreviation or false if the data cannot be found.
   */
  static getComponentAbbreviation(dataType) {
    if (dataType === null || typeof dataType !== 'object') {
      return false;
    }
    if (!Object.prototype.hasOwnProperty.call(dataType, 'field_agency_component')) {
      return false;
    }

    return dataType.field_agency_component.abbreviation
      ? dataType.field_agency_component.abbreviation
      : false;
  }

  /**
   * Appends report data to a row (component object).
   *
   * @param {Object} row
   *   An object of component data.
   * @param {string} reportId
   *   The id of the report that this row belongs to.
   * @returns {Object}
   *   A row of component data for the results table, including the reporting agency,
   *   fiscal year and component abbreviation.
   */
  appendReportData(row, reportId) {
    return Object.assign({}, row, {
      agency: this.getAgency(reportId),
      fiscalYear: this.getFiscalYear(reportId),
      component: AnnualReportStore.getComponentAbbreviation(row),
    });
  }

  __onDispatch(payload) {
    switch (payload.type) {
      case types.ANNUAL_REPORT_DATA_RECEIVE: {
        const { reports } = this.state;

        const updatedReports = reports.withMutations((mutableReports) => {
          payload.annualReports.forEach((report) => {
            // Merge new values if a report already exists since most report requests won't
            // contain all data.
            if (mutableReports.has(report.id)) {
              mutableReports.update(
                report.id,
                previousValue => previousValue.merge(new Map(report)),
              );
            } else {
              mutableReports.set(report.id, new Map(report));
            }
          });
        });

        Object.assign(this.state, {
          reports: updatedReports,
        });
        this.__emitChange();

        break;
      }
      default:
        break;
    }
  }
}

const annualReportStore = new AnnualReportStore(dispatcher);

export default annualReportStore;

export {
  AnnualReportStore,
};
