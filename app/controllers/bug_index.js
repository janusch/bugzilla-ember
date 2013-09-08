import Comment from 'bugzilla/models/comment';
import unhandledRejection from 'bugzilla/utils/unhandled_rejection';

var BugController = Ember.ObjectController.extend({
  needs: ['user'],
  user: Em.computed.alias('controllers.user'),

  actions: {
    showRemainingComments: function() {
      this.set('isShowingRemainingComments', true);
    },

    saveComment: function() {
      // TODO: figure out how to make comments a legit relationship on bug
      var newComment = Comment.create({
        text: this.get('newCommentText'),
        bug_id: this.get('id')
      });

      var self = this;
      newComment.save().then(function() {
        self.get('comments').pushObject(newComment);
        self.set('newCommentText', null);
      }).then(null, unhandledRejection);
    },

    reply: function(comment) {
      var newCommentText = this.get('newCommentText') || "",
          commentIndex = this.get('comments').indexOf(comment);

      newCommentText += "(In reply to %@ from comment #%@)\n".fmt(comment.get('creator'), commentIndex);
      newCommentText += comment.get("text").replace(/^/m, "> ");
      newCommentText += "\n\n";

      this.set('newCommentText', newCommentText);
    }
  },

  isShowingRemainingComments: false,
  newCommentText: null,

  keywords: function() {
    var keywords = this.get('content.keywords');
    return keywords && keywords.join(', ');
  }.property('content.keywords'),

  _pollingInterval: 30 * 1000,
  _pollingTimer: null,

  _startPolling: function() {
    if (Ember.testing || this._pollingTimer) { return; }

    // this._pollingTimer = Ember.run.later(this, function() {
    //   var content = this.get('content');
    //   content.reload();
    //   this._pollingTimer = null;
    //   this._startPolling();
    // }, this._pollingInterval);
  },

  _stopPolling: function() {
    if (this._pollingTimer) {
      Ember.run.cancel(this._pollingTimer);
      this._pollingTimer = null;
    }
  },

  init: function() {
    this._visibility = new Visibility({
      onHidden: this._stopPolling.bind(this),
      onVisible: this._startPolling.bind(this)
    });
  },

  willDestroy: function() {
    this._visibility.destroy();
  },

  _contentWillChange: function() {
    this._stopPolling();
  }.observesBefore('content'),

  _contentDidChange: function() {
    this._startPolling();
  }.observes('content')
});

export default BugController;
