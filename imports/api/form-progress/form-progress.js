import { Mongo } from 'meteor/mongo'

export const FormProgress = new Mongo.Collection('formProgress')

if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('formProgress', function(formTypeID) {
        if (formTypeID) {
            return FormProgress.find({ 'form_type_id': formTypeID });
        } else {
            return FormProgress.find({ 'status': 'in-progress', user_id: this.userId });

        }
    });
}