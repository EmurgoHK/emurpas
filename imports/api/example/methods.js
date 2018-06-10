import { Meteor } from 'meteor/meteor'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { ExampleCollection } from './exampleCollection'

SimpleSchema.extendOptions(['autoform'])

// 4. after defining the schema, we have to define methods that will be used by our form
export const newExample = new ValidatedMethod({
    name: 'newExample', // this name is the method name used in quickForm template 
    validate: ExampleCollection.schema.validator({
    	clean: true, // clean has to be used here so autoValues can execute
    	filter: false // but we don't want to filter out other fields
    }),
    run({ name, description, tags, accept, numValue, number, radio, author, createdAt }) {
        // execute any arbitary code here

    	ExampleCollection.insert({
    		name: name,
            description: description,
            tags: tags,
            accept: accept,
            numValue: numValue,
    		number: number,
    		radio: radio,
    		author: author, // auto filled
    		createdAt: createdAt // auto filled
    	})
    }
})
