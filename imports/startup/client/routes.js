import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'
import { notify } from "/imports/modules/notifier"

// Import needed templates
import '/imports/ui/pages/home/home'
import '/imports/ui/pages/notifications/notifications'
import '/imports/ui/pages/userInfo/userInfo'
import '/imports/ui/pages/userInfo/viewUserInfo'
import '/imports/ui/pages/applications/new'
import '/imports/ui/pages/applications/viewApplication'
import '/imports/ui/pages/contact/contact'
import '/imports/ui/pages/contact/viewContact'
import '/imports/ui/pages/contact/newContact'
import '/imports/ui/pages/login/login'
import '/imports/ui/pages/signup/signup'
import '/imports/ui/pages/userProfile/userProfile'
import '/imports/ui/pages/example/example'
import '/imports/ui/pages/not-found/not-found'

import '/imports/ui/pages/moderator/applications/modApplications'
import '/imports/ui/pages/moderator/application/modApplication'
import '/imports/ui/pages/moderator/users/modUsers'

const userLoginFilter = (context, redirect, _stop) => {
	let oldRoute = '/'
	let authRoutes = ['/login', '/signup'];
	let withoutLoginAccess = []; //['/contact', '/contact/new'];

	if (context.oldRoute !== undefined) {
		oldRoute = context.oldRoute.path
	}

	// restrict access to auth pages when user is signed in
	if (Meteor.userId() && authRoutes.includes(context.path)) {
		redirect(oldRoute)
	}

	if(!Meteor.userId() && withoutLoginAccess.includes(context.path)){

	} else if (!Meteor.userId() && !authRoutes.includes(context.path)) {
		notify("Login to continue!", "error")
		redirect('/login')
	}
}
function scrollToTop(context, redirect) {
    $(window).scrollTop(0);
}

const modRoutes = FlowRouter.group({
	prefix: '/moderator',
  	name: 'moderator'
})

// Redirect to login
Accounts.onLogout((user) => {
	FlowRouter.redirect('/');
})

FlowRouter.triggers.enter([userLoginFilter,scrollToTop], { except: ['App.home'] })

// Set up all routes in the app
FlowRouter.route('/', {
  	name: 'App.home',
  	action() {
    	BlazeLayout.render('App_body', {
			header: 'header',
			sidebar: 'sidebar',
    		main: 'App_home'
    	})
  	}
})

FlowRouter.route('/userInfo/:userInfoID?', {
  	name: 'userInfo',
  	action: () => {
    	BlazeLayout.render('App_body', {
			header: 'header',
			sidebar: 'sidebar',
    		main: 'userInfo'
    	})
  	}
})

FlowRouter.route('/contact', {
	name: 'contact',
	action: () => {
	  	BlazeLayout.render('App_body', {
		  	header: 'header',
		  	sidebar: 'sidebar',
		  	main: 'contact'
	  	})
	}
})

FlowRouter.route('/contact/new', {
	name: 'newContact',
	action: () => {
	  	BlazeLayout.render('App_body', {
		  	header: 'header',
		  	sidebar: 'sidebar',
		  	main: 'newContact'
	  	})
	}
})

FlowRouter.route('/contact/view/:id', {
	name: 'viewContact',
	action: () => {
	  	BlazeLayout.render('App_body', {
		  	header: 'header',
		  	sidebar: 'sidebar',
		  	main: 'viewContact'
	  	})
	}
})

FlowRouter.route('/applications/:projectID?', {
	name: 'newApplication',
	action: () => {
	  BlazeLayout.render('App_body', {
		  header: 'header',
		  sidebar: 'sidebar',
		  main: 'newApplication'
	  })
	}
})

FlowRouter.route('/applications/:projectID/view', {
	name: 'viewApplication',
	action: () => {
	  BlazeLayout.render('App_body', {
		  header: 'header',
		  sidebar: 'sidebar',
		  main: 'viewApplication'
	  })
	}
})

FlowRouter.route('/userInfo/:id/view', {
	name: 'viewUserInfo',
	action: () => {
	  BlazeLayout.render('App_body', {
		  header: 'header',
		  sidebar: 'sidebar',
		  main: 'viewUserInfo'
	  })
	}
})

FlowRouter.route('/notifications', {
	name: 'notifications',
	action: () => {
	  	BlazeLayout.render('App_body', {
		  	header: 'header',
		  	sidebar: 'sidebar',
		  	main: 'notifications'
	  	})
	}
})

FlowRouter.route('/login', {
	name: 'login',
	action() {
	  BlazeLayout.render('auth', {
		  main: 'login'
	  })
	}
})

FlowRouter.route('/signup', {
	name: 'signup',
	action() {
	  BlazeLayout.render('auth', {
		  main: 'signup'
	  })
	}
})

FlowRouter.route('/profile/:userId', {
    name: 'viewProfile',
    action: () => {
        BlazeLayout.render('App_body', {
          header: 'header',
		  sidebar: 'sidebar',
		  main: 'viewProfile'
        })
    }
})

FlowRouter.route('/profile/:userId/edit', {
    name: 'editProfile',
    action: () => {
        BlazeLayout.render('App_body', {
          header: 'header',
		  sidebar: 'sidebar',
		  main: 'editProfile'
        })
    }
})

FlowRouter.route('/example', {
	name: 'example',
	action() {
	  BlazeLayout.render('App_body', {
		  header: 'header',
		  sidebar: 'sidebar',
		  main: 'example'
	  })
	}
})

modRoutes.route('/applications', {
    action: () => {
        BlazeLayout.render('App_body', {
          header: 'header',
		  sidebar: 'sidebar',
		  main: 'modApplications'
        })
    },
    name: 'modApplications'
})

modRoutes.route('/application/:id', {
    action: () => {
        BlazeLayout.render('App_body', {
          header: 'header',
		  sidebar: 'sidebar',
		  main: 'modApplication'
        })
    },
    name: 'modApplication'
})

modRoutes.route('/users', {
    action: () => {
        BlazeLayout.render('App_body', {
          header: 'header',
		  sidebar: 'sidebar',
		  main: 'modUsers'
        })
    },
    name: 'modUsers'
})


FlowRouter.notFound = {
  	action() {
    	BlazeLayout.render('App_body', {
    		main: 'App_notFound'
    	})
  	}
}
