import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'
import { ValidatedMethod } from 'meteor/mdg:validated-method'

import { Comments } from './comments'

import { isModerator } from '/imports/api/user/methods'

import { notifyApplication } from '/imports/api/project-questions/methods'

const notify = (type, resId, fieldId, text) => {
    if (type === 'question') {
        notifyApplication(type, resId, fieldId, text)
    }
}

export const newComment = new ValidatedMethod({
    name: 'newComment',
    validate:
        new SimpleSchema({
            parentId: {
                type: String,
                optional: false
            },
            text: {
                type: String,
                max: 1000,
                optional: false
            },
            resourceId: {
                type: String,
                optional: false
            },
            fieldId: {
                type: String,
                optional: true
            },
            type: {
                type: String,
                optional: true
            },
            isModeratorOnly: {
                type: Boolean,
                optional: true,
            }
        }).validator({
            clean: true
        }),
    run({ parentId, resourceId, fieldId, text, type, isModeratorOnly }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('Error.', 'You have to be logged in.')
        }

        if (isModeratorOnly) {
            if (!isModerator(Meteor.userId())) {
                throw new Meteor.Error('Error.', 'You have to be a moderator to post moderator only comments.');
            }
        } else {
            if (parentId !== resourceId && Comments.findOne({_id: parentId}).isModeratorOnly) {
                throw new Meteor.Error('Error.', 'Children of moderator only posts have to be moderator only as well.');
            }
        }

        try {
            notify(type, resourceId, fieldId, text)
        } catch (e) {}
        
        return Comments.insert({
            parentId: parentId,
            fieldId: fieldId,
            text: text,
            createdAt: new Date().getTime(),
            createdBy: Meteor.userId(),
            resourceId: resourceId,
            type: type || 'comment',
            isModeratorOnly,
        })
    }
})

export const removeComment = new ValidatedMethod({
    name: 'removeComment',
    validate:
        new SimpleSchema({
            commentId: {
                type: String,
                optional: false
            }
        }).validator(),
    run({ commentId }) {
        let comment = Comments.findOne({
            _id: commentId
        })

        if (!comment) {
            throw new Meteor.Error('Error.', 'Comment doesn\'t exist.')
        }

        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }

        if (comment.createdBy !== Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You can\'t remove a comment that you haven\'t posted.')
        }

        // if the comment that's being deleted has children, append the children to the parent comment
        let comments = Comments.find({
            parentId: comment._id
        }).fetch()

        comments.forEach(i => {
            Comments.update({
                _id: i._id
            }, {
                $set: {
                    parentId: comment.parentId
                }
            })
        })

        return Comments.remove({
            _id: commentId
        })
    }
})

export const editComment = new ValidatedMethod({
    name: 'editComment',
    validate:
        new SimpleSchema({
            commentId: {
                type: String,
                optional: false
            },
            text: {
                type: String,
                max: 1000,
                optional: false
            }
        }).validator({
            clean: true
        }),
    run({ commentId, text }) {
        let comment = Comments.findOne({
            _id: commentId
        })

        if (!comment) {
            throw new Meteor.Error('Error.', 'Comment doesn\'t exist.')
        }

        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }

        if (comment.createdBy !== Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You can\'t edit a comment that you haven\'t posted.')
        }

        return Comments.update({
            _id: commentId
        }, {
            $set: {
                text: text,
                editedAt: new Date().getTime()
            }
        })
    }
})
