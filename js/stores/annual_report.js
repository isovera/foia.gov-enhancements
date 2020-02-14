import { Map } from 'immutable';
import { Store } from 'flux/utils';
import dispatcher from '../util/dispatcher';
import { types } from '../actions/report';

// @todo: remove, not sure this should be used this way...
import annualReportDataFormStore from '../stores/annual_report_data_form';

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


  static getSelectedAgencies() {
    // @todo: This method returns agency/component abbreviations, but we may
    // want to return uuids instead.
    // @todo: remove test values.
    const formatted = {
      DOJ: ['OJP', 'ATF', 'FALSEY', 'Agency Overall'],
    };
    const { selectedAgencies } = annualReportDataFormStore.getState();
    selectedAgencies.forEach((agency) => {
      switch (agency.type) {
        case 'agency': {
          const { abbreviation } = agency;
          // @todo: use a list, or be sure not to wipe out existing values...
          // formatted[abbreviation] = ['Agency Overall'];
          break;
        }

        case 'agency_component': {
          // @todo: this...
          break;
        }

        default:
          break;
      }
    });
    return formatted;
  }

  getReportDataForType(dataType) {
    // @todo: Confirm: Any need to filter invalid fiscal years here? Any need to
    // filter data based on any other report filters here? Assuming not...

    const tableData = [];
    const { reports } = this.state;
    const selectedAgencies = AnnualReportStore.getSelectedAgencies();

    // Iterate over each report.
    reports.forEach((report) => {
      const { abbreviation: agency_abbr, name: agency_name } = report.get('field_agency');
      const selectedComponents = [...selectedAgencies[agency_abbr] || []];

      // @todo: may want to refactor part of the loop so that it's run only once
      // for the ANNUAL_REPORT_DATA_COMPLETE event instead of for each dataType.
      const components = report.get('field_agency_components')
        .map(component => component.abbreviation)
        // Filter out components we haven't selected.
        .filter((component) => {
          return Object.keys(selectedAgencies).includes(agency_abbr)
            && selectedAgencies[agency_abbr].includes(component);
        })
        // Since "Agency Overall" is not represented as a component attached to
        // the report, manually add it to the end of the array when applicable.
        .concat(selectedComponents.filter(component => component === 'Agency Overall'));

      components.forEach((component) => {
        let row = {};
        // Iterate over fields defined for the dataType.
        dataType.fields.forEach((field) => {
          const { id, overall_field } = field;
          const fiscal_year = report.get('field_foia_annual_report_yr');

          row = Object.assign(row, {
            component,
            agency: agency_name,
            fiscal_year,
            // @todo: Confirm: Any requirements on how this string is formed / formatted?
            id: `${agency_abbr}__${component}__${fiscal_year}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          });

          // Handle agency overall fields.
          if (component.toLowerCase() === 'agency overall') {
            // @todo: Any specific formatting requirements to consider here for each field value?
            row[id] = report.get(overall_field);
            return;
          }

          // @todo: handle all other fields in FOIA-320.
          const parts = id.split('.');
          row[id] = `Implementation pending for ${parts.join(' --> ')}`;
        });

        // Push the completed row.
        tableData.push(row);
      });
    });

    return tableData;
  }

  __onDispatch(payload) {
    switch (payload.type) {
      // @todo: this is all temporary. Remove in favor of Steph's work
      case types.ANNUAL_REPORT_DATA_COMPLETE: {
        const { selectedDataTypes } = annualReportDataFormStore.getState();
        selectedDataTypes.forEach((dataType) => {
          const newTable = {};
          newTable.columns = [];
          newTable.tableData = this.getReportDataForType(dataType);
          console.log(newTable);
        });

        break;
      }

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
