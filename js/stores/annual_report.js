import { Map } from 'immutable';
import { Store } from 'flux/utils';
import dispatcher from '../util/dispatcher';
import { types } from '../actions/report';

// @todo: remove, not sure this should be used this way...
import annualReportDataFormStore from '../stores/annual_report_data_form';
import annualReportDataTypesStore from './annual_report_data_types';
import { FoiaAnnualReportRequestBuilder } from '../util/foia_annual_report_request_builder';

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
    const { selectedAgencies } = annualReportDataFormStore.getState();
    return selectedAgencies.reduce((formatted, selected) => {
      switch (selected.type) {
        case 'agency': {
          const { abbreviation, components } = selected;
          const selectedComponents = formatted[abbreviation] || [];
          const componentAbbreviations = components
            .filter(component => component.selected)
            .map(component => component.abbreviation);

          formatted[abbreviation] = selectedComponents.concat(...componentAbbreviations.toArray())
            .filter((value, index, array) => array.indexOf(value) === index)
            .sort();
          break;
        }
        case 'agency_component': {
          const { abbreviation, agency } = selected;
          const agencyComponents = formatted[agency.abbreviation] || [];
          formatted[agency.abbreviation] = agencyComponents
            .concat(abbreviation)
            .filter((value, index, array) => array.indexOf(value) === index)
            .sort();
          break;
        }
        default: {
          break;
        }
      }

      return formatted;
    }, {});
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
      const fiscal_year = report.get('field_foia_annual_report_yr');
      const selectedComponents = [...selectedAgencies[agency_abbr] || []];
      const componentData = AnnualReportStore.getComponentData(dataType, report);

      selectedComponents.forEach((abbreviation) => {
        const component = componentData[abbreviation] || false;
        if (!component) {
          return;
        }

        let row = Object.assign({}, {
          field_agency_component: abbreviation,
          field_agency: agency_name,
          field_foia_annual_report_yr: fiscal_year,
          // @todo: Confirm: Any requirements on how this string is formed / formatted?
          id: `${agency_abbr}__${abbreviation}__${fiscal_year}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
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
