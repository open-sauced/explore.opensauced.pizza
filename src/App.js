import React, { Component } from 'react';
import GraphiQL from 'graphiql';
import GraphiQLExplorer from 'graphiql-explorer';
import {buildClientSchema, getIntrospectionQuery, parse} from 'graphql';

import { makeDefaultArg, getDefaultScalarArgValue } from './CustomArgs';
import ColorSchemeToggle from './ColorSchemeToggle';
import Config from "./config";

import 'graphiql/graphiql.css';
import './App.css';

const DEFAULT_QUERY = `# shift-option/alt-click on a query below to jump to it in the explorer
# option/alt-click on a field in the explorer to select all subfields

  query IssuesBeforeQuery($owner: String!, $repo: String!, $cursor: String) {
    gitHub {
      repositoryOwner(login: $owner) {
        repository(name: $repo) {
          issues(first: 5, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}, before: $cursor) {
            totalCount
            data: edges {
              cursor
              node {
                id
                title
                url
                state
                author {
                  login
                }
                labels(first: 5) {
                  data: edges {
                    node {
                      id
                      name
                      color
                    }
                  }
                }
                comments {
                  totalCount
                }
                milestone {
                  title
                }
                participants(first: 3) {
                  totalCount
                  nodes {
                    login
                    avatarUrl
                  }
                }
                createdAt
              }
            }
          }
        }
      }
    }
  }
`;

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

  handleToggleExplorer = () => {
    this.setState({ explorerIsOpen: !this.state.explorerIsOpen });
  };

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
    const { query, schema, explorerIsOpen, isLoggedIn } = this.state;

    return (
      <div className="graphiql-container">
        <GraphiQLExplorer
          schema={schema}
          query={query}
          onEdit={this.handleEditQuery}
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
        >
          <GraphiQL.Toolbar>
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
