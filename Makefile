REPORTER = spec

lint:
	./node_modules/.bin/jshint -c .jshintrc ./test ./lib ./Gruntfile.js

test:
	# $(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/mocha -b -R $(REPORTER)

test-coveralls:
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	$(MAKE) test
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
		./node_modules/mocha/bin/_mocha --report lcovonly -- -R $(REPORTER) && \
		cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js || true

.PHONY: test
