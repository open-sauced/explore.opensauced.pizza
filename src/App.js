import React, { Component } from 'react';
import GraphiQL from 'graphiql';
import GraphiQLExplorer from 'graphiql-explorer';
import {buildClientSchema, getIntrospectionQuery, parse} from 'graphql';

import { makeDefaultArg, getDefaultScalarArgValue } from './CustomArgs';
import ColorSchemeToggle from './ColorSchemeToggle';
import Config from "./config";
import Queries from "./Queries"
import 'graphiql/graphiql.css';
import './App.css';
const DEFAULT_QUERY = "";
const blacklistRe = /(adroll|airtable|apollo|asana|box|brex|bundlephobia|chargebee|clearbit|cloudflare|contentful|crunchbase|descuri|devTo|docusign|dribbble|dropbox|eggheadio|emailNode|eventil|facebookBusiness|fedex|firebase|gmail|google|googleAds|hubspot|immigrationGraph|intercom|logdna|mailchimp|meetup|mixpanel|mux|netlify|notion|npm|openCollective|orbit|productHunt|quickbooks|rss|salesforce|slack|spotify|stripe|trello|twilio|twitchTv|twitter|ups|usps|ynab|youTube|youTubeSearch|youTubeVideo|zeit|zendesk)/i;
const typeListBlackListFn = (f) => {
  return f.type && f.type.ofType && f.type.ofType.kind === "LIST"
    && f.type.ofType.ofType
    && f.type.ofType.ofType.ofType
    && f.type.ofType.ofType.ofType.name
    && blacklistRe.test(f.type.ofType.ofType.ofType.name)
}
const typeBlackListFn = (f) => {
  return !(
    (f.type && f.type.name && blacklistRe.test(f.type.name))
    || (f.name && blacklistRe.test(f.name))
    || (f.type && f.type.ofType && f.type.ofType.name && blacklistRe.test(f.type.ofType.name))
    || typeListBlackListFn(f)
  );
}
// Filter function for picking things that are not blacklisted
const nodeBlackListFn = (f) => {
  return !(
    (f.type && f.type.name && blacklistRe.test(f.type.name))
    || (f.name && blacklistRe.test(f.name))
  );
}
// Strips out dependencies that are blacklisted
const stripPrefixedDeps = (type) => {
  return {
    ...type,
    fields: type.fields ? type.fields.filter(typeBlackListFn) : type.fields,
    inputFields: type.inputFields ? type.inputFields.filter(typeBlackListFn) : type.inputFields,
    possibleTypes: type.possibleTypes ? type.possibleTypes.filter(typeBlackListFn) : type.possibleTypes
  }
};
// Removes OBJECT types that have had all of their fields stripped out.
const emptyObjectFilterFn = (type) => {
  return type.kind !== "OBJECT" || type.fields.length > 0;
};
class App extends Component {
  constructor(props) {
    super(props);
    this.graphiql = null;
    this.state = {
      schema: null,
      query: DEFAULT_QUERY,
      explorerIsOpen: true,
      isLoggedIn: false,
    };
  }

  componentDidMount() {
    Config.fetchOneGraph({
      query: getIntrospectionQuery(),
    }).then((result) => {
      const editor = this.graphiql.getQueryEditor();
      editor.setOption('extraKeys', {
        ...(editor.options.extraKeys || {}),
        'Shift-Alt-LeftClick': this.handleInspectOperation,
      });
      // To modify schema, we follow this process:
      // 1) Remove all the types we don't want, based on regex match
      // 2) Strip out all of the dependencies that matched the same regex
      // 3) Remove types of kind=OBJECT that have had their fields emptied out (to satisfy schema validation)
      const filteredTypes = result.data.__schema.types
        .filter(nodeBlackListFn)
        .map(stripPrefixedDeps) 
        .filter(emptyObjectFilterFn);
      const filteredData = {
        __schema: {
          ...result.data.__schema, 
          types: filteredTypes
        }
      };
      this.setState({ schema: buildClientSchema(filteredData) });
    });

    Config.auth.isLoggedIn('github').then((isLoggedIn) => this.setState({isLoggedIn}))
  }

  handleInspectOperation(
    cm,
    mousePos,
  ) {
    const { query } = this.state;
    const parsedQuery = parse(query || '');

    if (!parsedQuery) {
      console.error("Couldn't parse query document");
      return null;
    }

    const token = cm.getTokenAt(mousePos);
    const start = { line: mousePos.line, ch: token.start };
    const end = { line: mousePos.line, ch: token.end };
    const relevantMousePos = {
      start: cm.indexFromPos(start),
      end: cm.indexFromPos(end),
    };

    const position = relevantMousePos;

    const def = parsedQuery.definitions.find((definition) => {
      if (!definition.loc) {
        console.log('Missing location information for definition');
        return false;
      }

      const { loc } = definition;
      return loc.start <= position.start && loc.end >= position.end;
    });

    if (!def) {
      console.error(
        'Unable to find definition corresponding to mouse position',
      );
      return null;
    }

    let operationKind;
    if (def.kind === 'OperationDefinition') {
      operationKind = def.operation;
    } else {
      operationKind = def.kind === 'FragmentDefinition'
        ? 'fragment'
        : 'unknown';
    }

    let operationName;
    if (def.kind === 'OperationDefinition' && !!def.name) {
      operationName = def.name.value;
    } else {
      operationName = def.kind === 'FragmentDefinition' && !!def.name
        ? def.name.value
        : 'unknown';
    }

    const selector = `.graphiql-explorer-root #${operationKind}-${operationName}`;

    const el = document.querySelector(selector);
    if (el !== null) {
      el.scrollIntoView();
    }

    return false;
  }

  handleEditQuery = (query) => this.setState({ query });
  handleToggleExplorer = () => {
    this.setState({ explorerIsOpen: !this.state.explorerIsOpen });
  };
  handleEditOperationName = (operationName) => this.setState({ operationName })
  handleLogin = () => {
    const { isLoggedIn } = this.state;

    if (isLoggedIn) {
      Config.auth.logout('github').then((response) => {
        if (response.result === 'success') {
          console.log('Logout succeeded');
          this.setState({ isLoggedIn: false });
        } else {
          console.log('Logout failed');
        }
      });
    } else {
      Config.auth
          .login('github')
          .then(() => {
            Config.auth.isLoggedIn('github').then((isLoggedIn) => {
              if (isLoggedIn) {
                console.log('Successfully logged in to GitHub');
                this.setState({ isLoggedIn: true });
              } else {
                console.log('Did not grant auth for GitHub');
              }
            });
          })
          .catch((e) => console.error('Problem logging in', e));
    }
  }

  render() {
    const { query, schema, isLoggedIn, explorerIsOpen, operationName } = this.state;

    return (
      <div className="graphiql-container">
        <GraphiQLExplorer
          schema={schema}
          query={query}
          onEdit={this.handleEditQuery}
          operationName={operationName}
          onRunOperation={(operationName) => this.graphiql.handleRunQuery(operationName)}
          explorerIsOpen={explorerIsOpen}
          onToggleExplorer={this.handleToggleExplorer}
          getDefaultScalarArgValue={getDefaultScalarArgValue}
          makeDefaultArg={makeDefaultArg}
        />
        <GraphiQL
          ref={(ref) => { this.graphiql = ref; }}
          fetcher={Config.fetchOneGraph}
          schema={schema}
          query={query}
          onEditQuery={this.handleEditQuery}
          operationName={operationName}
        >
          <GraphiQL.Toolbar>
          <select
                defaultValue={""}
                onChange={(e)=>{
                  const key = e.target.value;
                  this.handleEditQuery(Queries[key]);
                  this.handleEditOperationName(key);
                }}
              >
              <option value="">Choose a Query</option>
              {Object.keys(Queries).filter(key => key !== 'ALL').map(key => {
                const isMutation = Queries[key].trim().indexOf('mutation') === 0;
                return <option key={key} value={key}>{isMutation?"(Mutation) ":""}{key}</option>
              })}
            </select>
            <GraphiQL.Button
              onClick={() => this.graphiql.handlePrettifyQuery()}
              label="Prettify"
              title="Prettify Query (Shift-Ctrl-P)"
            />
            <GraphiQL.Button
              onClick={() => this.graphiql.handleToggleHistory()}
              label="History"
              title="Show History"
            />
            <GraphiQL.Button
              onClick={this.handleToggleExplorer}
              label="Explorer"
              title="Toggle Explorer"
            />
            <ColorSchemeToggle />
            <GraphiQL.Button
                onClick={this.handleLogin}
                label={`Log ${isLoggedIn ? 'out of' : 'in to'} GitHub`}
                title="GitHub"
            />
          </GraphiQL.Toolbar>
        </GraphiQL>
      </div>
    );
  }
}

export default App;
