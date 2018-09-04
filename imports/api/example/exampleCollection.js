import { Mongo } from 'meteor/mongo'
// import { Meteor } from 'meteor/meteor'

import SimpleSchema from 'simpl-schema'

// we have to add 'autoform' option to the simpleSchema
SimpleSchema.extendOptions(['autoform'])

// 1. we start the form creation by defining a new collection for the form
const ExampleCollection = new Mongo.Collection('exampleCollection')

// 2. then we have to define a new schema that both the validated-method and autoform will use
// the simplest way to achieve this is to place the schema in the collection object

// other examples using autoform are available here: http://autoform.meteorapp.com/quickform, https://github.com/aldeed/meteor-autoform
// SimpleSchema documentation is available here: https://github.com/aldeed/simple-schema-js
ExampleCollection.schema = new SimpleSchema({
    name: {
        type:  String, // type of the input field
        label: 'Name' // label on the form (if you omit this field, key will be used as a label on the form)
    },
    description: {
        type: String,
        min: 20, // set the minimum amount of chars
        max: 1000, // and the maximum
        autoform: {
            rows: 5 //using rows directive here will produce a textarea on the form
        }
    },
    tags: {
        type: Array, // using array as a type will produce a special form elements for adding array fields
        optional: true, // even though it's optional, it'll show on the form, use autoform: { type: 'hidden' } to hide elements
        minCount: 1,
        maxCount: 4
    },
    'tags.$': {
        type: String // type of array elements is also important as it determines the type of the input field
    },
    accept: {
        type: Boolean, // boolean type will produce a checkbox on the form
        defaultValue: true,
        label: 'Do you accept this example?',
        custom : function() {
            if (this.field("accept").value == false) {
                return "required";
            }
        },
    },
    numValue: {
        type: Number, // number type won't allow characters in the input field
        label: 'Enter a number'
    },
    number: {
      	type: Number,
      	allowedValues: [1, 2, 3], // using allowedValues will generate a select box on the form
      	defaultValue: 2,
      	label: 'Choose a number'
   	},
   	radio: {
      	type: Boolean,
        label: 'Do you agree?',
        custom : function() {
            if (this.field("radio").value == false) {
                return "required";
            }
        },
        autoform: {
        	type: 'boolean-radios', // using boolean-radios will generate radios instead of checkboxes on the form
         	trueLabel: 'Yes, I agree', // we can use custom labels here also
         	falseLabel: 'No, I do not agree',
            defaultValue: false, // the value that's first selected when the form is rendered
      	}
   	},
    author: {
        type: String,
        label: 'Author',
        autoValue: function() {
            return this.userId || 'Test author' // fill this field automatically with given value, which can be useful for fields that shouldn't be displayed on the form
        },
        autoform: {
            type: 'hidden' // don't show this field on autoform
        }
    },
    createdAt: {
        type: Number,
        label: 'Created At',
        autoValue: () => new Date().getTime(),
        autoform: {
            type: 'hidden'
        }
    }
})

// 3. we have to attach the schema to our collection, otherwise AutoForm won't work correctly
ExampleCollection.attachSchema(ExampleCollection.schema)

export { ExampleCollection }
