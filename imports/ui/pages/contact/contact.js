import "./contact.html";

import { FlowRouter } from "meteor/kadira:flow-router";
import { Contact } from "/imports/api/contact/contact";

import { removeContact } from "/imports/api/contact/methods";

import { notify } from "/imports/modules/notifier";
import moment from "moment";

// export this one so it can be used on other templates
export const formatStatus = status => {
  let formatted = {};
  formatted.status = status;

  if (status === "resolved") {
    formatted.klass = "success";
  }

  if (status === "open") {
    formatted.klass = "primary";
  }

  if (status === "closed") {
    formatted.klass = "danger";
  }

  return formatted;
};
const CommentCounts = new Mongo.Collection("commentCounts");
Template.contact.onCreated(function() {
  this.subscribe("contact");
  this.subscribe("commentCounts.by.resource");
  this.subscribe("users");

  this.filter = new ReactiveVar(["open"]);
});

Template.contact.helpers({
  checked: function() {
    return ~Template.instance()
      .filter.get()
      .indexOf(this.choice);
  },
  statuses: () => [
    {
      choice: "open",
      text: "Open"
    },
    {
      choice: "closed",
      text: "Closed"
    },
    {
      choice: "resolved",
      text: "Resolved"
    }
  ],
  hasContacts: () => Contact.find({}).count(),
  contact: () => {
    let user = Meteor.users.findOne({
      _id: Meteor.userId()
    });

    if (user) {
      return Contact.find(
        {
          status: {
            $in: Template.instance().filter.get()
          }
        },
        {
          sort: {
            createdAt: -1
          }
        }
      );
    }

    return false;
  },
  formatStatus: status => {
    return formatStatus(status);
  },
  author: userId => {
    let user = Meteor.users.findOne({ _id: userId }) || {};
    return user.username
      ? user.username
      : ((user.emails || [])[0] || {}).address;
  },
  formatDate: timestamp => {
    return moment(timestamp).format("MMMM Do YYYY, h:mm a");
  },
  commentCount: function() {
    return (CommentCounts.findOne({ resourceId: this._id }) || {}).count || 0;
  },
  isAuthor: function() {
    return this.createdBy === Meteor.userId();
  }
});

Template.contact.events({
  "click .remove": function(event, templateInstance) {
    event.preventDefault();

    removeContact.call(
      {
        contactId: this._id
      },
      (err, data) => {
        if (!err) {
          notify("Successfully removed.", "success");
        } else {
          notify(err.reason || err.message, "error");
        }
      }
    );
  },
  "click .filter-choice": function(event, templateInstance) {
    if (!$(event.currentTarget).is(":checked")) {
      // if it's not checked, remove it from the filter
      templateInstance.filter.set(
        templateInstance.filter.get().filter(i => i !== this.choice)
      );
    } else {
      // else, if it's checked, add it to the filter
      let filter = templateInstance.filter.get();

      // just in case, check if it's already in the filter
      if (!~filter.indexOf(this.choice)) {
        filter.push(this.choice);
      }

      templateInstance.filter.set(filter);
    }
  }
});
