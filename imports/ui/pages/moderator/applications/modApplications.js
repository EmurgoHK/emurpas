import './modApplications.html'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { FormProgress } from '/imports/api/form-progress/form-progress'

import { removeProjectQuestions } from '/imports/api/project-questions/methods'

import swal from 'sweetalert'
import moment from 'moment'
import { notify } from '/imports/modules/notifier'
import Chart from 'chart.js';

Template.modApplications.onCreated(function() {
    this.autorun(() => {
        this.subscribe('modProjectQuestions')
        this.subscribe('modFormProgress')
        this.subscribe('users')
    })

    this.search = new ReactiveVar('')
})

//chart to generate the sparkline graphs for the applicatin weight distribution
generateChart = function(id, data) {
    let chartElement = id + '_chart'
    const ctx = document.getElementById(chartElement).getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data,
            datasets: [{
                data: data
            }]
        },
        options: {
            responsive: false,
            legend: {
                display: false
            },
            elements: {
                line: {
                    borderColor: '#000000',
                    borderWidth: 1
                },
                point: {
                    radius: 0
                }
            },
            tooltips: {
                enabled: false
            },
            scales: {
                yAxes: [{
                    display: false
                }],
                xAxes: [{
                    display: false
                }]
            }
        }
    });
}

Template.modApplications.helpers({
    isInProgress: function(status) {
        return status == 'in-progress'
    },
    formProgress: function () {
        let search = Template.instance().search.get()
        let pq = []

        if (!search) {
            pq = ProjectQuestions.find({}, {
                sort: {
                    createdAt: -1
                }
            }).fetch().map(i => i._id)
        } else {
            let posAuthors = Meteor.users.find({
                $or: [
                {'username': new RegExp(search, 'ig')},
                {'emails.address': new RegExp(search, 'ig')}
                ]
            }).fetch().map(i => i._id)

            pq = ProjectQuestions.find({
                $or: [
                {status: new RegExp(search, 'ig')},
                {'team_members.name': new RegExp(search, 'ig')},
                {'team_members.email': new RegExp(search, 'ig')},
                {problem_description: new RegExp(search, 'ig')},
                {createdBy: {
                    $in: posAuthors
                }}
                ]
            }, {
                sort: {
                    createdAt: -1
                }
            }).fetch().map(i => i._id)
        }

        var progress = FormProgress.find({
            form_type: 'project',
            form_type_id: {
                $in: pq
            }
        }, {
            sort: {
                createdAt: -1
            }
        })

        return progress
    },
    eloRanking: function() {
        return (ProjectQuestions.findOne({
            _id: this.form_type_id
        }) || {}).eloRanking || '-'
    },
    applicationWeight: function() {
     return (ProjectQuestions.findOne({
         _id: this.form_type_id
     }) || {}).applicationWeight || '-'
    },
    chart: function() {
        //helper to generate the data payload for the sparkline graphs, we need to count the length of each
        //answer for this to work correctly.
      let id = this.form_type_id
      let getProjectData = (ProjectQuestions.findOne({ _id: id }))

      if(getProjectData){

      let problem_description = getProjectData.problem_description ? getProjectData.problem_description.length : 0;
      let possible_solution = getProjectData.possible_solution ? getProjectData.possible_solution.length : 0
      let proposed_solution = getProjectData.proposed_solution ? getProjectData.proposed_solution.length : 0
      let attempted_solution = getProjectData.attempted_solution ? getProjectData.attempted_solution.length : 0
      let blockchain_use_reason = getProjectData.blockchain_use_reason ? getProjectData.blockchain_use_reason.length : 0
      let blockchain_solution_proposal = getProjectData.blockchain_solution_proposal ? getProjectData.blockchain_solution_proposal.length : 0
      let ada_blockchain_aspects = getProjectData.ada_blockchain_aspects ? getProjectData.ada_blockchain_aspects.length : 0
      let target_market_size = getProjectData.target_market_size ? getProjectData.target_market_size.length : 0
      let target_market_regions = getProjectData.target_market_regions ? getProjectData.target_market_regions.length : 0
      let competitors = getProjectData.competitors ? getProjectData.competitors.length : 0
      let target_audience = getProjectData.target_audience ? getProjectData.target_audience.length : 0
      let prototype = getProjectData.prototype ? getProjectData.prototype.length : 0
      let development_roadmap = getProjectData.development_roadmap ? getProjectData.development_roadmap.length : 0
      let business_plan = getProjectData.business_plan ? getProjectData.business_plan.length : 0
      let disruptive_solution_reason = getProjectData.disruptive_solution_reason ? getProjectData.disruptive_solution_reason.length : 0
      let user_onboarding_process = getProjectData.user_onboarding_process ? getProjectData.user_onboarding_process.length : 0
      let unfair_advantage_reason = getProjectData.unfair_advantage_reason ? getProjectData.unfair_advantage_reason.length : 0

      let data = [problem_description,possible_solution,proposed_solution,attempted_solution,blockchain_use_reason,blockchain_solution_proposal,blockchain_solution_proposal,ada_blockchain_aspects,target_market_size,target_market_regions,competitors,target_audience,prototype,development_roadmap,business_plan,disruptive_solution_reason,user_onboarding_process,unfair_advantage_reason]

      //generate sparkline graphs
      setTimeout(function() {
                generateChart(id,data)
            },0);
  }
  
  },
    author: (userId) => {
        let user = Meteor.users.findOne({ _id: userId }) || {}
        return ((user.emails || [])[0] || {}).address
    },
    formatDate: (timestamp) => {
        return moment(timestamp).format('MMMM Do YYYY, h:mm a')
    },
    formatProgressStatus: (status, progressID) => {
        let formatted = {}
        formatted.status = status
        formatted.id = progressID

        if (status === 'completed') {
            formatted.klass = 'success'
            formatted.text = 'View'
            formatted.path = 'view'

        }
            
        if (status === 'in-progress') {
            formatted.klass = 'secondary'
            formatted.text = 'Resume'
            formatted.path = ''
        }

        return formatted
    }
})

Template.modApplications.events({
    'keyup .search': (event, templateInstance) => templateInstance.search.set($(event.currentTarget).val()),
    'click .js-remove': function(event, templateInstance) {
        swal({
            text: `Are you sure you want to remove this application?`,
            icon: 'warning',
            buttons: {
                cancel: {
                    text: 'No',
                    value: false,
                    visible: true,
                    closeModal: true
                },
                confirm: {
                    text: 'Yes',
                    value: true,
                    visible: true,
                    closeModal: true
                }
            },
            dangerMode: true
        }).then(confirmed => {
            if (confirmed) {
                removeProjectQuestions.call({
                    projectId: this.form_type_id
                }, (err, data) => {
                    if (err) {
                        notify(err.reason || err.message, 'error')
                    }
                })
            }
        })
    }
})