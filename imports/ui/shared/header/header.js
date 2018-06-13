import './header.html'

Template.header.events({
    'click .sidebar-toggler': function() {
        $('body').toggleClass("sidebar-lg-show")
    }
})