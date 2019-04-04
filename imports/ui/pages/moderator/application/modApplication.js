import "./modApplication.html";
import "../../comments/commentBody";

import { Comments } from "/imports/api/comments/comments";

import { newComment } from "/imports/api/comments/methods";

import { FlowRouter } from "meteor/kadira:flow-router";

import { ProjectQuestions } from "/imports/api/project-questions/project-questions";
import { FormProgress } from "/imports/api/form-progress/form-progress";
import { QuestionRating } from "/imports/api/question-rating/question-rating";
import { Delegates } from "/imports/api/delegates/delegates";
import { EloRankings } from "/imports/api/elo/eloRankings";

import { removeProjectQuestions } from "/imports/api/project-questions/methods";
import { rateQuestion } from "/imports/api/question-rating/methods";
import {
  delegateQuestion,
  revokeDelegation
} from "/imports/api/delegates/methods";
import { calculateFormRating } from "/imports/api/form-progress/methods";

import swal from "sweetalert";
import { notify } from "/imports/modules/notifier";

const MAX_RATING = 10;

Template.modApplication.onCreated(function() {
  window.testingComments = Comments;

  this.autorun(() => {
    this.subscribe("modProjectQuestions");
    this.subscribe("modFormProgress");
    this.subscribe("questionRating.application", FlowRouter.getParam("id"));

    this.subscribe("users");
    this.subscribe("comments.item", FlowRouter.getParam("id"));

    this.subscribe("delegates");
  });

  this.ids = new ReactiveVar([]);

  this.autorun(() => {
    let ids = [FlowRouter.getParam("id")];

    // find the other application
    let appIds = ProjectQuestions.find({
      _id: {
        $ne: FlowRouter.getParam("id")
      }
    })
      .fetch()
      .map(i => i._id);

    appIds.forEach(i => {
      let ratings = QuestionRating.find({
        $and: [
          {
            $or: [
              {
                // symmetry
                applications: [FlowRouter.getParam("id"), i._id]
              },
              {
                applications: [i._id, FlowRouter.getParam("id")]
              }
            ]
          },
          {
            owner: Meteor.userId()
          }
        ]
      }).count();

      //if (ratings < (ProjectQuestions.schema.objectKeys().length - 3)) { // all questions haven't been rated yet
      ids.push(i);
      //}
    });

    this.ids.set(ids);

    this.subscribe("elo", ids);
  });

  //calculate the weight of the application, this is done on
  // creation by will do it on view as well for legacy applicaitons
  calculateFormRating.call(
    {
      applicationId: FlowRouter.getParam("id")
    },
    (err, data) => {
      if (err) {
        console.error(err);
      }
    }
  );

  this.message = new ReactiveDict();
  this.reply = new ReactiveDict();
  this.show = new ReactiveDict();
  this.delegates = new ReactiveDict();
});

Template.modApplication.helpers({
  apps: function() {
    let ids = Template.instance().ids.get();

    return ProjectQuestions.find({
      _id: {
        $in: ids.slice(0, 2) // find two applications for side-by-side comparasion
      }
    })
      .fetch()
      .sort((i1, i2) => {
        return ids.indexOf(i1._id) - ids.indexOf(i2._id); // sort them naturally
      })
      .map(i => {
        this.question = this.question || {};

        let rating = QuestionRating.findOne({
          $and: [
            {
              $or: [
                {
                  // symmetry
                  applications: [ids[0], ids[1]]
                },
                {
                  applications: [ids[1], ids[0]]
                }
              ]
            },
            {
              questionId: this.question.key,
              owner: Meteor.userId()
            }
          ]
        });

        return _.extend(i, {
          answer: i[this.question.key] || "-",
          question: {
            label: this.question.label,
            key: this.question.key
          },
          delegates: this.delegates,
          delegatedFrom: this.delegatedFrom,
          rating: rating
        });
      }); // add previous context so all helpers continue to work correctly
  },
  canVote: function() {
    return Template.instance().ids.get().length >= 2; // moderators can only vote if thera are two or more applicatons
  },
  isInProgress: function() {
    let inprogress = FormProgress.findOne({
      form_type_id: this._id
    });

    return inprogress && inprogress.status == "in-progress";
  },
  questions: () => {
    let schema = ProjectQuestions.schema;

    let to_exclude = ["Created At", "Author", "Team members", "ELO", "ID"];

    return schema
      .objectKeys()
      .map(key => {
        const label = schema.label(key);

        if (!to_exclude.includes(label)) {
          let delegates =
            Delegates.findOne({
              questionId: key,
              createdBy: Meteor.userId()
            }) || {};

          let delegatedFrom = Delegates.find({
            questionId: key,
            delegateTo: Meteor.userId()
          }).fetch();

          delegatedFrom = delegatedFrom.map(i =>
            Meteor.users.findOne({
              _id: i.createdBy
            })
          );

          delegates.user = Meteor.users.findOne({
            _id: delegates.delegateTo
          });

          return {
            question: { label: label, key: key },
            delegates: delegates,
            delegatedFrom: delegatedFrom
          };
        }
      })
      .filter(val => val);
  },
  isAnswered: answer => {
    if (answer === "-") return false;

    return true;
  },
  ratingValues: () => {
    return Array.from({ length: MAX_RATING }, (_, i) => i + 1);
  },
  hasNotRated: questionRating => {
    if (
      questionRating &&
      questionRating.ratings.some(r => r.userId === Meteor.userId())
    ) {
      return false;
    }

    return true;
  },
  previousRating: (questionRating, rating) => {
    if (
      questionRating &&
      questionRating.ratings.some(
        r => r.userId === Meteor.userId() && r.rating === rating
      )
    ) {
      return "checked";
    }
  },
  hasRatings: ratings => {
    if (ratings !== undefined) return true;
  },
  ratings: function() {
    return QuestionRating.findOne({
      applicationId: this._id,
      questionCode: this.question.key
    });
  },
  comments: function() {
    return Comments.find(
      {
        parentId: this._id,
        fieldId: this.question.key
      },
      {
        sort: {
          createdAt: -1
        }
      }
    );
  },
  commentInvalidMessage: function() {
    return (Template.instance().message.get(this.question.key) || {})[this._id];
  },
  showReply: function() {
    return (Template.instance().reply.get(this.question.key) || {})[this._id];
  },
  showComments: function() {
    return (Template.instance().show.get(this.question.key) || {})[this._id];
  },
  showLine: function() {
    return (
      (Template.instance().reply.get(this.question.key) || {})[this._id] ||
      (Template.instance().show.get(this.question.key) || {})[this._id]
    );
  },
  commentCount: function() {
    return Comments.find({
      fieldId: this.question.key,
      resourceId: this._id
    }).count();
  },
  type: () => "question",
  isDelegated: function() {
    let delegates = Delegates.findOne({
      createdBy: Meteor.userId(),
      questionId: this.question.key
    });

    return (
      delegates &&
      (~delegates.scope.indexOf("all") || ~delegates.scope.indexOf(this._id)) &&
      !~(delegates.except || []).indexOf(this._id)
    ); // filter out all delegations not connected to this application
  },
  isDelegatedTo: function() {
    let delegates = Delegates.findOne({
      delegateTo: Meteor.userId(),
      questionId: this.question.key
    });

    return (
      delegates &&
      (~delegates.scope.indexOf("all") || ~delegates.scope.indexOf(this._id)) &&
      !~(delegates.except || []).indexOf(this._id)
    ); // filter out all delegations not connected to this application
  },
  delegateIntent: function() {
    return (Template.instance().delegates.get(this.question.key) || {})[
      this._id
    ];
  },
  moderators: () =>
    Meteor.users.find({
      _id: {
        $ne: Meteor.userId()
      },
      moderator: true
    }),
  username: function(context) {
    context = context || this;

    return (
      (context.profile && context.profile.username) ||
      (context.emails && context.emails[0] && context.emails[0].address)
    );
  },
  notRated: function() {
    return !this.rating;
  },
  winner: function() {
    return this.rating && this.rating.winner === this._id;
  },
  eloRank: function() {
    return (
      (
        EloRankings.findOne({
          questionId: this.question.key,
          applicationId: this._id
        }) || {}
      ).ranking || 400
    ); // 400 is the default value
  },
  hasNext: function() {
    return Template.instance().ids.get().length > 2; // if there are more than 2 applications
  }
});

Template.modApplication.events({
  "click .js-revoke": function(event, templateInstance) {
    event.preventDefault();

    revokeDelegation.call(
      {
        questionId: this.question.key,
        except: [$(event.currentTarget).data("scope")]
      },
      (err, data) => {
        if (!err) {
          notify("Successfully revoked.");
        } else {
          notify("Error while revoking delegation.", "error");
        }
      }
    );
  },
  "click .new-comment": function(event, templateInstance) {
    event.preventDefault();

    newComment.call(
      {
        parentId: this._id,
        text: $(`#comments-${this.question.key}-${this._id}`).val(),
        resourceId: this._id,
        fieldId: this.question.key,
        type: "question"
      },
      (err, data) => {
        $(`#comments-${this.question.key}-${this._id}`).val("");

        if (!err) {
          notify("Successfully commented.", "success");

          templateInstance.reply.set(
            this.question.key,
            _.extend(templateInstance.reply.get(this.question.key) || {}, {
              [this._id]: false
            })
          );

          templateInstance.message.set(
            this.question.key,
            _.extend(templateInstance.reply.get(this.question.key) || {}, {
              [this._id]: ""
            })
          );
          templateInstance.show.set(
            this.question.key,
            _.extend(templateInstance.show.get(this.question.key) || {}, {
              [this._id]: true
            })
          );
        } else {
          templateInstance.message.set(
            this.question.key,
            _.extend(templateInstance.message.get(this.question.key) || {}, {
              [this._id]: err.reason || err.message
            })
          );
        }
      }
    );
  },
  "click .new-comment-moderator": function(event, templateInstance) {
    event.preventDefault();

    newComment.call(
      {
        parentId: this._id,
        text: $(`#comments-${this.question.key}-${this._id}`).val(),
        resourceId: this._id,
        fieldId: this.question.key,
        isModeratorOnly: true
      },
      (err, data) => {
        $(`#comments-${this.question.key}-${this._id}`).val("");

        if (!err) {
          notify("Successfully commented.", "success");
          templateInstance.reply.set(
            this.question.key,
            _.extend(templateInstance.reply.get(this.question.key) || {}, {
              [this._id]: false
            })
          );

          templateInstance.message.set(
            this.question.key,
            _.extend(templateInstance.message.get(this.question.key) || {}, {
              [this._id]: ""
            })
          );
          templateInstance.show.set(
            this.question.key,
            _.extend(templateInstance.show.get(this.question.key) || {}, {
              [this._id]: true
            })
          );
        } else {
          templateInstance.message.set(
            this.question.key,
            _.extend(templateInstance.message.get(this.question.key) || {}, {
              [this._id]: err.reason || err.message
            })
          );
        }
      }
    );
  },
  "click .comment-new": function(event, templateInstance) {
    event.preventDefault();

    templateInstance.reply.set(
      this.question.key,
      _.extend(templateInstance.reply.get(this.question.key) || {}, {
        [this._id]: true
      })
    );
  },
  "click .cancel-new": function(event, templateInstance) {
    event.preventDefault();

    templateInstance.reply.set(
      this.question.key,
      _.extend(templateInstance.reply.get(this.question.key) || {}, {
        [this._id]: false
      })
    );
  },
  "click .comment-show": function(event, templateInstance) {
    event.preventDefault();

    templateInstance.show.set(
      this.question.key,
      _.extend(templateInstance.reply.get(this.question.key) || {}, {
        [this._id]: !(templateInstance.show.get(this.question.key) || {})[
          this._id
        ]
      })
    );
  },
  "click .js-remove": function(event, _templateInstance) {
    swal({
      text: `Are you sure you want to remove this application?`,
      icon: "warning",
      buttons: {
        cancel: {
          text: "No",
          value: false,
          visible: true,
          closeModal: true
        },
        confirm: {
          text: "Yes",
          value: true,
          visible: true,
          closeModal: true
        }
      },
      dangerMode: true
    }).then(confirmed => {
      if (confirmed) {
        removeProjectQuestions.call(
          {
            projectId: FlowRouter.getParam("id")
          },
          (err, data) => {
            if (err) {
              notify(err.reason || err.message, "error");
            } else {
              FlowRouter.go("/moderator/applications");
            }
          }
        );
      }
    });
  },
  "click .js-delegate": function(event, templateInstance) {
    event.preventDefault();

    templateInstance.delegates.set(
      this.question.key,
      _.extend(templateInstance.reply.get(this.question.key) || {}, {
        [this._id]: !(templateInstance.delegates.get(this.question.key) || {})[
          this._id
        ]
      })
    );

    if (templateInstance.delegates.get(this.question.key)) {
      Meteor.setTimeout(
        () => $(`.js-user-choice-${this.question.key}`).select2(),
        500
      );
    } else {
      $(".select2").remove();
    }
  },
  "click .js-delegate-question": (event, templateInstance) => {
    event.preventDefault();

    delegateQuestion.call(
      {
        questionId: $(event.currentTarget).data("question"),
        scope: [$(event.currentTarget).data("scope")],
        delegateTo: $(
          `.js-user-choice-${$(event.currentTarget).data("question")}`
        ).val()
      },
      (err, data) => {
        if (!err) {
          notify("Successfully delegated.");

          templateInstance.delegates.set(
            $(event.currentTarget).data("question"),
            false
          );
        } else {
          notify("Error while delegating question.", "error");
        }
      }
    );
  },
  "click .js-vote": function(event, templateInstance) {
    event.preventDefault();

    rateQuestion.call(
      {
        questionId: this.question.key,
        applications: templateInstance.ids.get().slice(0, 2),
        winner: this._id
      },
      (err, data) => {
        if (err) {
          notify(err.reason || err.message, "error");
        }
      }
    );
  },
  "click .js-next": (event, templateInstance) => {
    event.preventDefault();

    let ids = Template.instance().ids.get();

    Template.instance().ids.set(ids.filter(i => i !== ids[1])); // remove the second application from the list
  }
});
