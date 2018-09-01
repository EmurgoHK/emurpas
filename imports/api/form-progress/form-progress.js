import { Mongo } from 'meteor/mongo'
import { isModerator } from '/imports/api/user/methods'

export const FormProgress = new Mongo.Collection('formProgress')

if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('formProgress', function(formTypeID) {
        if (formTypeID) {
            return FormProgress.find({ 'form_type_id': formTypeID });
        } else {
            return FormProgress.find({ user_id: this.userId });
        }
    })
            

    Meteor.publish('modFormProgress', (projectID) => {
        if (Meteor.userId() && isModerator(Meteor.userId())) {
            if (projectID) {
                return FormProgress.find({
                    'form_type_id': projectID
                })
            } else {
                return FormProgress.find({})
            }
        }
    })
}