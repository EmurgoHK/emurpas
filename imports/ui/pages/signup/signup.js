import { FlowRouter } from 'meteor/kadira:flow-router'
import { notify } from '/imports/modules/notifier'
import './signup.html'

Template.signup.events({
    'click #goToLogin' (event) {
        event.preventDefault()
        FlowRouter.go('/login')
    },
    'submit' (event) {
        event.preventDefault()
        let target = event.target;
        
        if (target.email.value !== '' && target.password.value !== '' && target.username.value !== '') {
            let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            let emailValidation = re.test(target.email.value);
            if(!emailValidation){
                notify('Please provide valid email address.', 'error');
                return;
            }
            if (target.confirmPassword.value === target.password.value) {
                Accounts.createUser({
					email: target.email.value,
                    password: target.password.value,
                    username: target.username.value
				}, (err) => {
                    if (err) {
                        notify(err.message, 'error')
                        return;
                    }
                    FlowRouter.go(window.last || '/')
                    return;
                })
                return;
            }
            notify('confirm password doesn\'t match password', 'error');
            return;
        }
        notify('email/username/password fields are required', 'error')
    }
})