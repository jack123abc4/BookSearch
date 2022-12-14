const { AuthenticationError } = require('apollo-server-express');
const { Book, User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return await User.findOne({ _id: context.user._id });
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No profile with this email found!');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect password!');
      }

      const token = signToken(user);
      return { token, user };
  
    },
  
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);

      return { token, user };
    },
    saveBook: async(parent, args, context) => {
      if (context.user) {
        const book = await Book.create(args)
        const updatedUser = await User.findOneAndUpdate(
          {_id: context.user._id},
          { $addToSet: {savedBooks: book}},
          { new: true, runValidators: true}
        );
        return updatedUser;
      }

      throw new AuthenticationError('You need to be logged in!');

    },
    removeBook: async(parent, {bookId}) => {
      if (context.user) {
        const book = await Book.findOne({bookId: bookId});
        return await User.findOneAndUpdate(
          {_id: context.user__id},
          { $pull: { books: book}},
          { new: true }
        );
      }
      throw new AuthenticationError('You need to be logged in!');
    }
  }
};


module.exports = resolvers;
