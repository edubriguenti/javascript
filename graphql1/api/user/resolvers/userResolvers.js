const { GraphQLScalarType } = require('graphql')

const userResolvers = {

    respostaCustom: {
        __resolveType(obj, context, info) {
            return false
        },
    },

    RolesType: {
        ESTUDANTE: "ESTUDANTE",
        DOCENTE: "DOCENTE",
        COORDENACAO: "COORDENACAO"
    },

    DateTime: new GraphQLScalarType({
        name: 'DateTime',
        description: 'String de data e hora no formato ISO-8601',
        serialize: (value) => value,
        parseValue: (value) => new Date(value),
        parseLiteral: (ast) => new Date(ast.value)
    }),

    Query: {
        users: (root, args, { dataSources }, info) => {
            return dataSources.usersAPI.getUsers()
        },
        user: (root, { id }, { dataSources }) => {
            return dataSources.usersAPI.getUserById(id)
        }
    },

    Mutation: {
        adicionaUser: (root, { user }, { dataSources }) => {
            return dataSources.usersAPI.adicionaUser(user)
        },

        atualizaUser: async (root, novosDados, { dataSources }) => {
            return dataSources.usersAPI.atualizaUser(novosDados)
        },

        deletaUser: async (root, { id }, { dataSources }) => {
            return await dataSources.usersAPI.deletaUser(id)
        }
    }

}

module.exports = userResolvers