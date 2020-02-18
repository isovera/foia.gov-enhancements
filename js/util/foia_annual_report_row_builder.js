import annualReportDataTypesStore from '../stores/annual_report_data_types';

/**
 * Builds rows for display in the results table, based on the set
 * data and data type.
 */
class FoiaAnnualReportRowBuilder {
  /**
   * Set a data type that a table is being built for.
   *
   * @param {Object} dataTypeId
   *   The data type id.
   * @returns {FoiaAnnualReportRowBuilder}
   */
  setDataType(dataTypeId) {
    this.dataType = annualReportDataTypesStore.getDataType(dataTypeId);

    return this;
  }

  /**
   * An object containing data that needs to be transformed into rows.
   *
   * @param {Object|Map} data
   *   An object of data.  This could come in multiple forms.
   *   - A report for building a row of agency overall data.
   *   - A simple component data object:
   *   {
   *     field_example_parent.field_example_child_1: 1,
   *     field_agency_component: 'ABBR',
   *     field_example_parent.field_example_child_2: 'N/A',
   *   }
   *   - A complex component data object with a hasChildren property,
   *     where each child represents a row. Used to build rows of data when
   *     a component may have multiple rows of data.
   *    {
   *      hasChildren: true,
   *      statute_values_for_component: {
   *       field_example_parent.field_example_child_1: 1,
   *       field_agency_component: 'ABBR',
   *       field_example_parent.field_example_child_2: 'N/A',
   *      },
   *      other_statute_values_for_component: {
   *       field_example_parent.field_example_child_1: 1,
   *       field_agency_component: 'ABBR',
   *       field_example_parent.field_example_child_2: 'N/A',
   *      },
   *    }
   *
   * @returns {FoiaAnnualReportRowBuilder}
   */
  setData(data) {
    this.data = data || {};

    return this;
  }

  /**
   * The abbreviation of the component that rows are being built for.
   *
   * @param {string} componentAbbreviation
   *   The component abbreviation.
   * @returns {FoiaAnnualReportRowBuilder}
   */
  setComponentAbbreviation(componentAbbreviation) {
    this.componentAbbreviation = componentAbbreviation;
    this.isOverall = componentAbbreviation.toLowerCase() === 'agency overall';

    return this;
  }

  /**
   * Build an array of rows based on the existing data.
   *
   * @param {Object} defaults
   *   Default row values
   * @returns {{}[]}
   *   An array of row objects.
   */
  build(defaults = {}) {
    if (this.data.hasChildren) {
      return Object.keys(this.data).map((key) => {
        if (key === 'hasChildren') {
          return false;
        }

        return this._build(this.data[key], defaults);
      }).filter(item => item !== false);
    }

    return [this._build(this.data, defaults)];
  }

  /**
   * Private build method that builds a single row.
   *
   * @param {Object} data
   *   Component or report data.
   * @param {Object} defaults
   *   Default row values.
   * @returns {{}}
   *   A row object.
   * @private
   */
  _build(data, defaults = {}) {
    const row = Object.assign({}, defaults);
    if (!this.dataType) {
      return row;
    }

    // Iterate over fields defined for the dataType.
    this.dataType.fields.forEach((field) => {
      const { id, overall_field } = field;
      // Do not print a column for footnotes.
      if (id.indexOf('field_footnote') === 0) {
        return;
      }

      // Handle agency overall fields.
      const value = this.isOverall ? data.get(overall_field) : data[id];

      row[id] = FoiaAnnualReportRowBuilder.normalizeValue(value);
    });

    return row;
  }

  /**
   * Normalize values that are objects with a value property.
   *
   * @param {*} value
   *   A field value that may be an object with a value property.
   *   {
   *     value: 3,
   *     format: null,
   *     processed: '<p>3</p>',
   *   }
   * @returns {*}
   *   The normalized field value.
   */
  static normalizeValue(value) {
    if (typeof value === 'object' && value !== null && Object.prototype.hasOwnProperty.call(value, 'value')) {
      return value.value;
    }

    return value;
  }
}

export default FoiaAnnualReportRowBuilder;
