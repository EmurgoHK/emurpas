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
    this.sort = new ReactiveVar('date-desc')
    this.filter = new ReactiveVar(['completed', 'in-progress'])
})

Template.modApplications.onRendered(function() {
    //init tooltips on weight icons
    setTimeout(() => {
        $('[data-toggle="tooltip"]').tooltip()
    }, 0)

});

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
            }).fetch().map(i => _.extend(i, {
                progress: FormProgress.findOne({
                    form_type_id: i._id
                })
            }))
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
                ],
                $or: [{
                    isInvalid: null
                }, {
                    isInvalid : false
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

        let sortBy = Template.instance().sort.get()
        let filterBy = Template.instance().filter.get()

        return pq.sort((i1, i2) => {
            if (sortBy === 'date-desc') return i2.createdAt - i1.createdAt
            if (sortBy === 'date-asc') return i1.createdAt - i2.createdAt

            if (sortBy === 'num-desc') return i2.id - i1.id
            if (sortBy === 'num-asc') return i1.id - i2.id

            if (sortBy === 'weight-desc') return (i2.applicationWeight || 0) - (i1.applicationWeight || 0)
            if (sortBy === 'weight-asc') return (i1.applicationWeight || 0) - (i2.applicationWeight || 0)

            i1.status = i1.progress.status === 'completed' ? 1 : 0
            i2.status = i2.progress.status === 'completed' ? 1 : 0

            if (sortBy === 'status-desc') return i2.status - i1.status
            if (sortBy === 'status-asc') return i1.status - i2.status

            if (sortBy === 'elo-desc') return (i2.eloRanking || 0) - (i1.eloRanking || 0)
            if (sortBy === 'elo-asc') return (i1.eloRanking || 0) - (i2.eloRanking || 0)
        }).filter(i => ~filterBy.indexOf(i.progress.status))
    },
    sortBy: (by) => Template.instance().sort.get() === by,
    filterBy: (by) => ~Template.instance().filter.get().indexOf(by),
    eloRanking: function() {
        return this.eloRanking || '-'
    },
    applicationWeight: function() {
        let weight = this.applicationWeight;

//we may need to tweak these numbers a little once we start to see the average weights on applications
        if (weight > 300) {
            return { color: '', data: 'A lot of effort' }
        } else if (weight > 100 && weight < 300) {
            return { color: 'orange', data: 'An average amount of effort' }
        } else {
            return { color: 'green', data: 'Not as much effort as we would like' }
        }

    },
    chart: function() {
        //helper to generate the data payload for the sparkline graphs, we need to count the length of each
        //answer for this to work correctly.

        let getProjectData = this

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
        setTimeout(() => {
            generateChart(this._id, data)
        }, 0)
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
    'click .filter': (event, templateInstance) => {
        event.preventDefault()

        let filter = $(event.currentTarget).attr('id')
        let filterBy = templateInstance.filter.get()

        if ($(event.currentTarget).is(':checked')) {
            filterBy.push(filter)
        } else {
            filterBy = filterBy.filter(i => i !== filter)
        }

        templateInstance.filter.set(filterBy)
    },
    'click .sort': (event, templateInstance) => {
        event.preventDefault()

        let sort = templateInstance.sort.get().split('-')

        let newBy = $(event.currentTarget).data('by')
        let newSort = 'desc'

        // if it was already sorted by the same property, just change the directon
        if (newBy === sort[0]) {
            newSort = sort[1] === 'desc' ? 'asc' : 'desc'
        }

        templateInstance.sort.set(`${newBy}-${newSort}`)
    },
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
                    projectId: this._id
                }, (err, data) => {
                    if (err) {
                        notify(err.reason || err.message, 'error')
                    }
                })
            }
        })
    }
})