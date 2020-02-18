import annualReportDataTypesStore from '../stores/annual_report_data_types';
import { FoiaAnnualReportRequestBuilder } from './foia_annual_report_request_builder';

/**
 * Builds an array of component data based on data type and report
 */
class FoiaAnnualReportComponentDataBuilder {
  /**
   * Set the data type that data will be retrieved for.
   *
   * @param {string} dataTypeId
   *   A data type id, based on the group id's in report_data_map.json.
   * @returns {FoiaAnnualReportComponentDataBuilder}
   */
  setDataType(dataTypeId) {
    this.dataType = annualReportDataTypesStore.getDataType(dataTypeId);
    this.fields = FoiaAnnualReportRequestBuilder.getSectionFields([this.dataType], false);

    return this;
  }

  /**
   * Set the report that data should be retrieved from.
   *
   * @param {Map} report
   *   An annual report Map object.
   * @returns {FoiaAnnualReportComponentDataBuilder}
   */
  setReport(report) {
    this.report = report;

    return this;
  }

  /**
   * Build an object of component data from the report data, based on the fields in the
   * data type.
   *
   * @returns {Object}
   * - An object of mapped component abbreviations and their fields.
   * {
   *   'USPS': {
   *     field_example_parent.field_example_one: 3,
   *     field_example_parent.field_example_two: 4,
   *   }
   * }
   * - An object of mapped component abbreviations and their statutes,
   *  if the data type includes field_statute_iv.
   * {
   *  'USPS': {
   *    hasChildren: true,
   *    'example_statute_name_one': {
   *      field_statute_iv.field_example_one: 3,
   *      field_statute_iv.field_example_one: 4,
   *    },
   *    'example_statute_name_two': {
   *      field_statute_iv.field_example_one: 3,
   *      field_statute_iv.field_example_one: 4,
   *    },
   *  }
   * }
   */
  build() {
    // This is an array of fields that exist directly on the report and are
    // included by this data type.
    const reportFields = this.fields.annual_foia_report_data || [];

    return reportFields.reduce((componentData, field) => {
      if (field.indexOf('field_footnote') === 0) {
        return componentData;
      }

      let childData = [];
      const fieldData = [...this.report.get(field)];
      // Flatten each piece of data that exists for the field in this report.
      while (fieldData.length > 0) {
        const component = fieldData.pop();
        childData = childData.concat(...this.getChildData(field, component));
      }

      // Merge all the data into an object keyed by a component abbreviation.
      // If a data type consists of data from multiple different drupal paragraph
      // fields, this will zip the paragraph data into a single object
      // per component.
      return childData.reduce((accumulator, datum) => (
        FoiaAnnualReportComponentDataBuilder.merge(accumulator, datum, field)
      ), componentData);
    }, {});
  }

  /**
   * Flattens field data into an array of data objects.
   *
   * @param field
   * @param component
   * @returns {[]}
   */
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

  /**
   * Merges a data object into an object keyed by the component abbreviation.
   *
   * New data will overwrite existing data if it contains the same keys and component abbreviation.
   *
   * @param {Object} existing
   *   The object to merge data into.
   * @param {Object} datum
   *   The data object to merge.
   * @param {string} parent
   *   The parent field name.
   * @returns {{}}
   *   An object of data, keyed by component abbreviation, that contains old and new values.
   */
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

  /**
   * Merges a statute data object into an object keyed by component abbreviation and statute name.
   *
   * New data will overwrite existing data if it contains the same keys, component abbreviation,
   * and statute name.
   *
   * @param {Object} existing
   *   The object to merge data into.
   * @param statute
   *   The statute data to merge in.
   * @returns {Object}
   *   An object of components and statutes.
   */
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
