import { AutoForm } from 'meteor/aldeed:autoform'
import typeahead from 'corejs-typeahead'

import './autoform-typeahead.css'
import './autoform-typeahead.html'

// custom typeahead component for autoform
AutoForm.addInputType('typeahead', {
    template: 'afTypeahead',
    valueOut: function() {
        return this.typeahead('val')
    },
    valueConverters: {
        number: AutoForm.Utility.stringToNumber,
        numberArray: val => {
            if (_.isArray(val)) {
                return _.map(val, item => AutoForm.Utility.stringToNumber($.trim(item)))
            }
            
            return val
        },
        boolean: AutoForm.Utility.stringToBool,
        booleanArray: val => {
            if (_.isArray(val)) {
                return _.map(val, item => AutoForm.Utility.stringToBool($.trim(item)))
            }
      
            return val
        },
        date: AutoForm.Utility.stringToDate,
        dateArray: val => {
            if (_.isArray(val)) {
                return _.map(val, item => AutoForm.Utility.stringToDate($.trim(item)))
            }

            return val
        }
    }
})

Template.afTypeahead.helpers({
    atts: function () {
        let atts = _.clone(this.atts)

        atts = AutoForm.Utility.addClass(atts, 'twitter-typeahead form-control')

        delete atts.typeaheadOptions
        delete atts.typeaheadDatasets
    
        return atts
    }
})

Template.afTypeahead.onRendered(function () {
    let substringMatcher = strs => {
        return (q, cb) => {
            let matches = []
            let substrRegex = new RegExp(q, 'i')

            $.each(strs, (i, str) => {
                if (substrRegex.test(str.label)) {
                    matches.push({
                        value: str.label
                    })
                }
            })

            cb(matches)
        }
    }

    let options = {
        highlight: true,
        hint: true
    }

    if (this.data.atts.typeaheadOptions) {
        _.extend(options, this.data.atts.typeaheadOptions)
    }
    
    let datasets = {
        source: substringMatcher(this.data.selectOptions),
        display: data => data.value
    }
    
    if (this.data.atts.typeaheadDatasets) {
        _.extend(datasets, this.data.atts.typeaheadDatasets)
    }

    $('.twitter-typeahead').typeahead(options, datasets)
})

Template.afTypeahead.onDestroyed(() => {
    $('.twitter-typeahead').typeahead('destroy')
})