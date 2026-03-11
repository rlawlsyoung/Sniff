# TEST!!!

@smoke @auth
Feature: Authentication and basic account flows

  Scenario: Successful login with valid account
    Given I am on the login page
    When I enter a valid email and password
    And I click the sign in button
    Then I should be redirected to the dashboard
    And I should see my account name in the header

  @negative
  Scenario: Login fails with wrong password
    Given I am on the login page
    When I enter a valid email and an invalid password
    And I click the sign in button
    Then I should see an "Invalid credentials" error message
    But I should stay on the login page

  @outline
  Scenario Outline: Password reset request by account status
    Given an account with status "<status>"
    When the user requests a password reset for "<email>"
    Then the response message should be "<message>"

    Examples:
      | status   | email              | message                         |
      | active   | user1@example.com  | Password reset link sent        |
      | blocked  | user2@example.com  | Account is blocked              |
      | archived | user3@example.com  | Account does not allow reset    |

  Scenario: Update profile nickname
    Given I am logged in as a valid user
    When I open the profile settings page
    And I change my nickname to "qa-runner"
    Then I should see a success toast message
    And the new nickname should be visible on refresh

@test
Feature: 테스트 2입니다

  Scenario: Successful login with valid account
    Given I am on the login page
    When I enter a valid email and password
    And I click the sign in button
    Then I should be redirected to the dashboard
    And I should see my account name in the header

  @negative
  Scenario: Login fails with wrong password
    Given I am on the login page
    When I enter a valid email and an invalid password
    And I click the sign in button
    Then I should see an "Invalid credentials" error message
    But I should stay on the login page

  @outline
  Scenario Outline: Password reset request by account status
    Given an account with status "<status>"
    When the user requests a password reset for "<email>"
    Then the response message should be "<message>"

    Examples:
      | status   | email              | message                         |
      | active   | user1@example.com  | Password reset link sent        |
      | blocked  | user2@example.com  | Account is blocked              |
      | archived | user3@example.com  | Account does not allow reset    |

  Scenario: Update profile nickname
    Given I am logged in as a valid user
    When I open the profile settings page
    And I change my nickname to "qa-runner"
    Then I should see a success toast message
    And the new nickname should be visible on refresh

