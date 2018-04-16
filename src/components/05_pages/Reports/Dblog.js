import React, { Component, Fragment } from 'react';
import { func, arrayOf, shape, string, number, bool } from 'prop-types';
import { connect } from 'react-redux';
import LoadingBar from 'react-redux-loading-bar';
import { Markup } from 'interweave';

import { requestDblogCollection } from '../../../actions/reports';
import { Table, TBody, THead } from '../../01_subatomics/Table/Table';

class Dblog extends Component {
  static propTypes = {
    requestDblogCollection: func.isRequired,
    entries: arrayOf(
      shape({
        wid: number.isRequired,
        messageFormattedPlain: string.isRequired,
        timestamp: number.isRequired,
        type: string.isRequired,
      }),
    ),
    types: arrayOf(string),
    filterOptions: shape({
      sort: string,
      severities: arrayOf(string),
    }),
    next: bool,
  };
  static defaultProps = {
    entries: null,
    types: null,
    filterOptions: {
      sort: '',
      severities: [],
    },
    next: true,
  };
  componentDidMount() {
    this.props.requestDblogCollection({
      ...this.props.filterOptions,
      sort: '-timestamp',
    });
  }
  generateTableRows = entries =>
    entries.map(({ wid, type, messageFormattedPlain, timestamp }) => ({
      key: String(wid),
      tds: [
        [`type-${wid}`, type],
        [`timestamp-${wid}`, timestamp],
        [
          `markup-${wid}`,
          <Markup
            content={`${
              messageFormattedPlain.length > 48
                ? `${messageFormattedPlain.substring(0, 48)}…`
                : messageFormattedPlain
            }`}
          />,
        ],
        [`user-${wid}`, ''],
      ],
    }));
  severityFilterHandler = e => {
    const severities = Array.from(e.target.options)
      .filter(option => option.selected)
      .map(option => option.value);
    const { sort, offset = 0 } = this.props.filterOptions;
    this.props.requestDblogCollection({
      severities,
      sort,
      offset,
    });
  };
  nextPage = () => {
    const { sort, severities = null, offset = 0 } = this.props.filterOptions;
    this.props.requestDblogCollection({
      severities,
      sort,
      offset: offset + 50,
    });
  };
  previousPage = () => {
    const { sort, severities = null, offset = 0 } = this.props.filterOptions;
    this.props.requestDblogCollection({
      severities,
      sort,
      offset: offset - 50,
    });
  };
  render() {
    if (!this.props.entries) {
      return <LoadingBar />;
    }
    return (
      <Fragment>
        <select key="select-type" label="Type">
          {this.props.types.map(type => (
            <option value={type} key={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          key="select-severity"
          label="Severity"
          multiple
          size={8}
          onChange={this.severityFilterHandler}
          selected={this.props.filterOptions.severities}
        >
          {[
            'Emergency',
            'Alert',
            'Critical',
            'Error',
            'Warning',
            'Notice',
            'Info',
            'Debug',
          ].map((value, index) => (
            <option value={index} key={value}>
              {value}
            </option>
          ))}
        </select>
        <button
          onClick={this.previousPage}
          disabled={this.props.filterOptions.offset <= 0}
        >
          prev
        </button>
        <button onClick={this.nextPage} disabled={!this.props.next}>
          next
        </button>
        <Table>
          <THead data={['Type', 'Date', 'Message', 'User']} />
          <TBody rows={this.generateTableRows(this.props.entries)} />
        </Table>
      </Fragment>
    );
  }
}

const mapStateToProps = ({ application: { dblog } }) => ({
  filterOptions: {
    offset: 0,
  },
  ...dblog,
});

export default connect(mapStateToProps, { requestDblogCollection })(Dblog);
