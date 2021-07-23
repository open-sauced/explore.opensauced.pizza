import React, { Component } from 'react';
import GraphiQL from 'graphiql';
//import GraphiQLExplorer from 'graphiql-explorer';
import {buildClientSchema, getIntrospectionQuery, parse} from 'graphql';

//import { makeDefaultArg, getDefaultScalarArgValue } from './CustomArgs';
import ColorSchemeToggle from './ColorSchemeToggle';
import Config from "./config";
import Queries from "./Queries"
import 'graphiql/graphiql.css';
import './App.css';

const DEFAULT_QUERY = Queries.ALL;

class App extends Component {
  constructor(props) {
    super(props);
    this.graphiql = null;
    this.state = {
      schema: null,
      query: DEFAULT_QUERY,
//      explorerIsOpen: false,
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

      this.setState({ schema: buildClientSchema(result.data) });
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

/*  handleToggleExplorer = () => {
    this.setState({ explorerIsOpen: !this.state.explorerIsOpen });
  };
*/
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
    const { query, schema, isLoggedIn } = this.state;

    return (
      <div className="graphiql-container">
        <GraphiQL
          ref={(ref) => { this.graphiql = ref; }}
          fetcher={Config.fetchOneGraph}
          schema={schema}
          query={query}
          onEditQuery={this.handleEditQuery}
        >
          <GraphiQL.Toolbar>
          <select
                onChange={(e)=>{
                  const key = e.target.value;
                  console.log(key);
                  this.handleEditQuery(Queries[key]);
                }}
              >
              {Object.keys(Queries).filter(key => key !== 'ALL').map(key => {
                const isMutation = Queries[key].trim().indexOf('mutation') == 0;
                return <option value={key}>{key}</option>
              })}
            </select>
            <GraphiQL.Button
              onClick={() => this.graphiql.handlePrettifyQuery()}
              label="Prettify"
              title="Prettify Query (Shift-Ctrl-P)"
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
