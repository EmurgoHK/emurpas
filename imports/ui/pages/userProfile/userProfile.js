import { updateProfile } from '/imports/api/user/methods'
import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { FormProgress } from '/imports/api/form-progress/form-progress'
import { UserQuestions } from '/imports/api/userQuestions/userQuestions'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { notify } from '/imports/modules/notifier'

import moment from 'moment'

import './viewProfile.html'
import './editProfile.html'
import './userProfile.scss'

Template.viewProfile.onCreated(function() {
  this.autorun(() => {
    this.subscribe('projectQuestions')
    this.subscribe('formProgress')
    this.subscribe('users')
    this.subscribe('userInfo')
  })
})

Template.viewProfile.helpers({
  user(){
    let user = Meteor.users.findOne({
      _id: FlowRouter.getParam('userId')
    })
    if(user){
      return {
        id : user._id,
        name : user.username ? user.username : 'No Name',
        bio : user.profile ? user.profile.bio : '',
        emails: user.emails
      }
    }
  },
  author: (userId) => {
      let user = Meteor.users.findOne({ _id: userId }) || {}
      return user.username ? user.username : ((user.emails || [])[0] || {}).address 
  },
  formatProgressStatus: (status, progressID, authorId) => {
      let formatted = {}
      formatted.status = status
      formatted.id = progressID

      if (status === 'completed') {
          formatted.klass = 'success'
          formatted.text = 'View'
          formatted.path = 'view'
          formatted.canSee = true
      }
          
      if (status === 'in-progress') {
          formatted.klass = 'secondary'
          formatted.text = 'Resume'
          formatted.path = ''
          formatted.canSee = Meteor.userId() === authorId
      }

      return formatted
  },
  isModerator () {
    let user = Meteor.users.findOne({
      _id: FlowRouter.getParam('userId')
    })
    if (user.moderator) {
      return true
    }
    return false
  },
  projectquestions: () => {
    let user = Meteor.users.findOne({
      _id: Meteor.userId()
    })
    if(user){
      return ProjectQuestions.find({
        $or: [{
            createdBy: Meteor.userId(),
        }, {
          'team_members.email': ((user.emails || [])[0] || {}).address 
        }]
      }, {
          sort: {
              createdAt: -1
          }
      }).fetch().map(i => _.extend(i, {
        progress: FormProgress.findOne({
          form_type_id: i._id
        })
      }))
    }
    return false
  },
  userInfo: () => {
    let user = Meteor.users.findOne({
        _id: Meteor.userId()
      })

      if (user) {
        let uq = UserQuestions.findOne({
          createdBy: Meteor.userId()
        })

        if (uq) {
          return _.extend(uq, {
                progress: FormProgress.findOne({
                  form_type_id: uq._id
                })
              })
        }
      }
  },
  formatDate: (timestamp) => {
      return moment(timestamp).format('MMMM Do YYYY, h:mm a')
  }
})

Template.editProfile.onCreated(function(){
  this.autorun(() => {
    this.subscribe('users')
  })
})

Template.editProfile.helpers({
  user(){
    let user = Meteor.users.findOne({_id : Meteor.userId()})
    return {
      name : user.username ? user.username : 'No Name',
      email : user.emails[0].address,
      bio : user.profile.bio ? user.profile.bio : '',
    }
  }
})

Template.editProfile.events({
  'click .save-changes': (event, templateInstance) => {
    event.preventDefault();
    updateProfile.call({
      uId : Meteor.userId(),
      username : $('#userName').val(),
      email : $('#userEmail').val(),
      bio : $('#bio').val(),
    }, (err, res) => {
      if (!err) {
        notify('Successfully updated.')
        history.back()
        return
      }

      if (err.details === undefined && err.reason) {
        notify(err.reason, 'error')
        return
      }

      if (err.details && err.details.length >= 1) {
        err.details.forEach(e => {
          $(`#${e.name}`).addClass('is-invalid')
          $(`#${e.name}Error`).show()
          $(`#${e.name}Error`).text(e.message)
        })
      }
    })
  },
})
