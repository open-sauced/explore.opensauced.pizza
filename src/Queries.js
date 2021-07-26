const Queries = {
    ALL:`query IssuesBeforeQuery($owner: String!, $repo: String!, $cursor: String) {
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
      query IssuesAfterQuery($owner: String!, $repo: String!, $cursor: String) {
        gitHub {
          repositoryOwner(login: $owner) {
            repository(name: $repo) {
              issues(first: 5, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}, after: $cursor) {
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
      query FetchGoal($number: Int!) {
        gitHub {
          viewer {
            repository(name: "open-sauced-goals") {
              issue(number: $number) {
                id
                body
                title
                number
              }
            }
          }
        }
      }
      query FetchGoals() {
        gitHub {
          viewer {
            repository(name: "open-sauced-goals") {
              id
              data: object(expression: "HEAD:data.json") {
                id
                ... on GitHubBlob {
                  id
                  text
                }
              }
              issues(
                first: 50
                states: OPEN
                orderBy: { direction: DESC, field: CREATED_AT }
              ) {
                totalCount
                nodes {
                  id
                  full_name: title
                  body
                  number
                  labels(first: 3) {
                    nodes {
                      color
                      name
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }
      query FetchOwnerQuery($owner: String!) {
        gitHub {
          user(login: $owner) {
            id
          }
        }
      }
      query FetchMemberStatusQuery() {
        gitHub {
          viewer {
            organization(login: "open-sauced") {
              viewerIsAMember
            }
          }
        }
      }
      query FetchRateLimitQuery() {
        gitHub {
          rateLimit {
            remaining
          }
        }
      }
      
      query FetchRepoCountQuery() {
        gitHub {
          search(query: "open-sauced-goals", type: REPOSITORY) {
            repositoryCount
          }
        }
      }
      mutation CreateOpenSaucedGoalsRepo($ownerId: ID!) {
        gitHub {
          cloneTemplateRepository(
            input: {
              repositoryId: "MDEwOlJlcG9zaXRvcnkyNjYzNDYyNDM="
              visibility: PUBLIC
              ownerId: $ownerId
              name: "open-sauced-goals"
            }
          ) {
            repository {
              id
              name
              nameWithOwner
              url
              issues(
                first: 10
                states: OPEN
                orderBy: { direction: DESC, field: CREATED_AT }
              ) {
                totalCount
                nodes {
                  id
                  title
                  body
                  number
                  labels(first: 3) {
                    nodes {
                      color
                      name
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }
      mutation CreateGoal(
        $repoId: ID!
        $title: String!
        $notes: String
      ) {
        __typename
        gitHub {
          createIssue(
            input: {
              title: $title
              repositoryId: $repoId
              body: $notes
            }
          ) {
            issue {
              id
              title
            }
          }
        }
      }
      mutation UpdateGoal(
        $id: ID!
        $state: GitHubIssueState
        $title: String
        $notes: String
      ) {
        __typename
        gitHub {
          updateIssue(
            input: {
              id: $id
              state: $state
              title: $title
              body: $notes
            }
          ) {
            issue {
              id
              body
            }
          }
        }
      }
      query FetchUserForkCount(
        $repoName: String!
        $repoOwner: String!
      ) {
        gitHub {
          repository(name: $repoName, owner: $repoOwner) {
            forks(affiliations: OWNER) {
              totalCount
            }
          }
        }
      }
      mutation ForkRepository(
        $repoName: String!
        $repoOwner: String!
      ) {
        gitHub {
          createFork_oneGraph(
            input: { repoName: $repoName, repoOwner: $repoOwner }
          ) {
            clientMutationId
            repository {
              id
              url
            }
          }
        }
      }
`,
    IssuesBeforeQuery:`query IssuesBeforeQuery($owner: String!, $repo: String!, $cursor: String) {
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
      }`,
    IssuesAfterQuery:`query IssuesAfterQuery($owner: String!, $repo: String!, $cursor: String) {
        gitHub {
          repositoryOwner(login: $owner) {
            repository(name: $repo) {
              issues(first: 5, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}, after: $cursor) {
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
      }`,
    FetchGoal:`
query FetchGoal($number: Int!) {
    gitHub {
        viewer {
        repository(name: "open-sauced-goals") {
            issue(number: $number) {
            id
            body
            title
            number
            }
        }
        }
    }
}        
    `,
    FetchGoals:`query FetchGoals() {
  gitHub {
    viewer {
      repository(name: "open-sauced-goals") {
        id
        data: object(expression: "HEAD:data.json") {
          id
          ... on GitHubBlob {
              id
              text
          }
        }
        issues(
          first: 50
          states: OPEN
          orderBy: { direction: DESC, field: CREATED_AT }
        ) {
          totalCount
          nodes {
            id
            full_name: title
            body
            number
            labels(first: 3) {
            nodes {
                color
                name
                id
            }
          }
        }
      }
    }
  }
  }
}`,
    FetchOwnerQuery:`query FetchOwnerQuery($owner: String!) {
  gitHub {
    user(login: $owner) {
      id
    }
  }
}`,
    FetchMemberStatusQuery:`query FetchMemberStatusQuery() {
  gitHub {
    viewer {
      organization(login: "open-sauced") {
        viewerIsAMember
      }
    }
  }
}`,
      FetchRateLimitQuery:`query FetchRateLimitQuery() {
  gitHub {
    rateLimit {
      remaining
    }
  }
}`,
      FetchRepoCountQuery:`query FetchRepoCountQuery() {
  gitHub {
    search(query: "open-sauced-goals", type: REPOSITORY) {
      repositoryCount
    }
  }
}`,
      CreateOpenSaucedGoalsRepo:`mutation CreateOpenSaucedGoalsRepo($ownerId: ID!) {
  gitHub {
    cloneTemplateRepository(
      input: {
        repositoryId: "MDEwOlJlcG9zaXRvcnkyNjYzNDYyNDM="
        visibility: PUBLIC
        ownerId: $ownerId
        name: "open-sauced-goals"
      }
    ) {
      repository {
        id
        name
        nameWithOwner
        url
        issues(
          first: 10
          states: OPEN
          orderBy: { direction: DESC, field: CREATED_AT }
        ) {
          totalCount
          nodes {
            id
            title
            body
            number
            labels(first: 3) {
              nodes {
                color
                name
                id
              }
            }
          }
        }
      }
    }
  }
}`,
    CreateGoal:`mutation CreateGoal(
  $repoId: ID!
  $title: String!
  $notes: String
) {
  __typename
  gitHub {
    createIssue(
      input: {
        title: $title
        repositoryId: $repoId
        body: $notes
      }
    ) {
      issue {
        id
        title
      }
    }
  }
}`,
    UpdateGoal:`mutation UpdateGoal(
  $id: ID!
  $state: GitHubIssueState
  $title: String
  $notes: String
) {
  __typename
  gitHub {
    updateIssue(
      input: {
        id: $id
        state: $state
        title: $title
        body: $notes
      }
    ) {
      issue {
        id
        body
      }
    }
  }
}`,
    FetchUserForkCount:`query FetchUserForkCount(
  $repoName: String!
  $repoOwner: String!
) {
  gitHub {
    repository(name: $repoName, owner: $repoOwner) {
      forks(affiliations: OWNER) {
        totalCount
      }
    }
  }
}`,
    ForkRepository:`mutation ForkRepository(
  $repoName: String!
  $repoOwner: String!
) {
  gitHub {
    createFork_oneGraph(
      input: { repoName: $repoName, repoOwner: $repoOwner }
    ) {
      clientMutationId
      repository {
        id
        url
      }
    }
  }
}`
};
export default Queries;