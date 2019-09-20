FROM ruby
COPY . .
RUN ["bundle", "install"]
RUN ["bundle", "exec", "rspec", "test.rb"]
