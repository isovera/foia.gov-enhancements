import annualReportDataTypesStore from '../stores/annual_report_data_types';
import { FoiaAnnualReportRequestBuilder } from './foia_annual_report_request_builder';

/**
 * Builds an array of component data based on data type and report
 */
class FoiaAnnualReportComponentDataBuilder {
  setDataType(dataTypeId) {
    this.dataType = annualReportDataTypesStore.getDataType(dataTypeId);
    this.fields = FoiaAnnualReportRequestBuilder.getSectionFields([this.dataType], false);

    return this;
  }

  setReport(report) {
    this.report = report;

    return this;
  }

  build() {
    const reportFields = this.fields.annual_foia_report_data || [];

    return reportFields.reduce((componentData, field) => {
      if (field.indexOf('field_footnote') === 0) {
        return componentData;
      }

      let childData = [];
      const fieldData = [...this.report.get(field)];
      while (fieldData.length > 0) {
        const component = fieldData.pop();
        childData = childData.concat(...this.getChildData(field, component));
      }

      return childData.reduce((accumulator, datum) => (
        FoiaAnnualReportComponentDataBuilder.merge(accumulator, datum, field)
      ), componentData);
    }, {});
  }

  getChildData(field, component) {
    const childFields = this.fields[field] || [];
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

      if (this.fields[`${field}.${key}`]) {
        const childData = component[key].reduce((children, child) => (
          children.concat(...this.getChildData(`${field}.${key}`, child))
        ), []);
        data = childData.reduce((flattened, child) => (
          flattened.concat(...data.map(parent => Object.assign(parent, child)))
        ), []);
      }
    });

    return data;
  }

  static merge(existing = {}, datum, parent) {
    const abbreviation = datum.component || false;
    if (!abbreviation) {
      return existing;
    }

    if (parent === 'field_statute_iv') {
      return FoiaAnnualReportComponentDataBuilder.mergeStatute(existing, datum);
    }

    const data = existing[abbreviation] || { hasChildren: false };
    existing[abbreviation] = Object.assign(data, datum);

    return existing;
  }

  static mergeStatute(existing, statute) {
    const abbreviation = statute.component || false;
    if (!abbreviation) {
      return existing;
    }

    const identifier = statute['field_statute_iv.field_statute']
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    let data = existing[abbreviation] || false;
    if (data) {
      data = data[identifier] || {};
      existing[abbreviation][identifier] = Object.assign(data, statute);

      return existing;
    }

    const updated = {};
    updated[identifier] = statute;
    existing[abbreviation] = Object.assign({ hasChildren: true }, updated);

    return existing;
  }
}

export default FoiaAnnualReportComponentDataBuilder;
