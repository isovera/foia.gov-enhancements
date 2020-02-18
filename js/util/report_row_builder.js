import annualReportDataTypesStore from '../stores/annual_report_data_types';

class FoiaAnnualReportRowBuilder {
  setDataType(dataType) {
    this.dataType = annualReportDataTypesStore.getDataType(dataType.id);

    return this;
  }

  setData(data) {
    this.data = data || {};

    return this;
  }

  setComponent(component) {
    this.component = component;
    this.isOverall = component.toLowerCase() === 'agency overall';

    return this;
  }

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

  static normalizeValue(value) {
    if (typeof value === 'object' && value !== null && Object.prototype.hasOwnProperty.call(value, 'value')) {
      return value.value;
    }

    return value;
  }
}

export default FoiaAnnualReportRowBuilder;
