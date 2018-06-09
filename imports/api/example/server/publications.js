import { Meteor } from 'meteor/meteor'
import { ExampleCollection } from '../exampleCollection'

Meteor.publish('example.all', () => ExampleCollection.find({}))
