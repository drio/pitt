# vim: ts=2:
.PHONY: test serve apu

client/app.js: \
	client/js/app.js \
	client/js/events.js \
	client/js/video-chat.js

%.js:
	@rm -f $@
	@echo '(function(exports){' > $@
	cat $(filter %.js,$^) | grep -v -P "vim:" >> $@
	@echo '})(this);' >> $@
	@chmod a-w $@

apu:
	rsync -avz --exclude=.git * apu:/usr/local/www/davidr.io/public/

serve: client/app.js
	NODE_PATH=$$NODE_PATH:$(shell pwd)/server; node server/load.js

test: app.js
	node test/multi_rooms.js >/dev/null
	node test/question.js >/dev/null
