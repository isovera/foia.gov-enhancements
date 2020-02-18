import { Map } from 'immutable';
import { Store } from 'flux/utils';
import dispatcher from '../util/dispatcher';
import { types } from '../actions/report';

// @todo: remove, not sure this should be used this way...
import annualReportDataFormStore from '../stores/annual_report_data_form';
import annualReportDataTypesStore from './annual_report_data_types';
import { FoiaAnnualReportRequestBuilder } from '../util/foia_annual_report_request_builder';
import FoiaAnnualReportRowBuilder from '../util/report_row_builder';

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

        const row = Object.assign({}, {
          field_agency_component: abbreviation,
          field_agency: agency_name,
          field_foia_annual_report_yr: fiscal_year,
          // @todo: Confirm: Any requirements on how this string is formed / formatted?
          id: `${agency_abbr}__${abbreviation}__${fiscal_year}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
        });
        const rowBuilder = new FoiaAnnualReportRowBuilder();

        tableData.push(
          ...rowBuilder
            .setComponentAbbreviation(abbreviation)
            .setDataType(dataType)
            .setData(component)
            .build(row),
        );
      });

      if (selectedComponents.indexOf('Agency Overall') !== -1) {
        const row = Object.assign({}, {
          field_agency_component: 'Agency Overall',
          field_agency: agency_name,
          field_foia_annual_report_yr: fiscal_year,
          // @todo: Confirm: Any requirements on how this string is formed / formatted?
          id: `${agency_abbr}__Agency_Overall__${fiscal_year}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
        });
        const rowBuilder = new FoiaAnnualReportRowBuilder();

        tableData.push(
          ...rowBuilder
            .setComponentAbbreviation('Agency Overall')
            .setDataType(dataType)
            .setData(report)
            .build(row),
        );
      }
    });

    return tableData;
  }

  static getComponentData(dataType, report) {
    const fields = FoiaAnnualReportRequestBuilder.getSectionFields([dataType], false);
    if (fields.annual_foia_report_data.length <= 0) {
      return [];
    }

    return fields.annual_foia_report_data.reduce((accumulator, field) => {
      if (field.indexOf('field_footnote') === 0) {
        return accumulator;
      }

      const fieldData = [...report.get(field)];
      while (fieldData.length > 0) {
        const component = fieldData.pop();
        const data = AnnualReportStore.getChildData(fields, field, component);

        if (data.length <= 0) {
          continue;
        }

        data.forEach((datum) => {
          const abbreviation = datum.component || false;
          if (!abbreviation) {
            return;
          }

          if (field === 'field_statute_iv') {
            const statute = datum['field_statute_iv.field_statute']
              .replace(/[^a-zA-Z0-9]/g, '_')
              .toLowerCase();
            let existing = accumulator[abbreviation] || false;
            if (existing) {
              existing = existing[statute] || {};
              accumulator[abbreviation][statute] = Object.assign(existing, datum);
            } else {
              const updated = {};
              updated[statute] = datum;
              accumulator[abbreviation] = Object.assign({ hasChildren: true }, updated);
            }
            return;
          }

          const existing = accumulator[abbreviation] || { hasChildren: false };
          accumulator[abbreviation] = Object.assign(existing, datum);
        });
      }
      return accumulator;
    }, {});
  }

  static getChildData(fields, field, component) {
    const childFields = fields[field] || [];
    let data = [];
    Object.keys(component).forEach((key) => {
      let value = component[key];
      let property = `${field}.${key}`;
      if (typeof value === 'object' && value !== null && Object.prototype.hasOwnProperty.call(value, 'value')) {
        value = value.value;
      }

      if (key === 'field_agency_component') {
        value = component.field_agency_component.abbreviation;
        property = 'component';
      }

      if (childFields.indexOf(key) !== -1 || key === 'field_agency_component') {
        if (data.length === 0) {
          const item = {};
          item[property] = value;
          data.push(item);
        } else {
          data = data.map((item) => {
            item[property] = value;
            return item;
          });
        }
      }

      if (fields[`${field}.${key}`]) {
        const childData = component[key].reduce((children, child) => (
          children.concat(...AnnualReportStore.getChildData(fields, `${field}.${key}`, child))
        ), []);
        data = childData.reduce((flattened, child) => (
          flattened.concat(...data.map(parent => Object.assign(parent, child)))
        ), []);
      }
    });

    return data;
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
