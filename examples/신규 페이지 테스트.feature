@mock @login
Feature: 로그인 기능 검증

  Scenario: 유효한 계정으로 로그인 성공
    Given 사용자가 로그인 페이지에 접속한다
    When 이메일 "qa.user@example.com" 과 비밀번호 "ValidPass123!" 를 입력하고 로그인 버튼을 클릭한다
    Then 대시보드로 이동해야 한다
    And 헤더에 사용자 이름 "QA 사용자" 가 표시되어야 한다

  @negative
  Scenario: 잘못된 비밀번호로 로그인 실패
    Given 사용자가 로그인 페이지에 접속한다
    When 이메일 "qa.user@example.com" 과 비밀번호 "WrongPass999!" 를 입력하고 로그인 버튼을 클릭한다
    Then "이메일 또는 비밀번호가 올바르지 않습니다" 오류 메시지가 표시되어야 한다
    And 로그인 페이지에 그대로 머물러야 한다

  @negative
  Scenario: 존재하지 않는 이메일로 로그인 실패
    Given 사용자가 로그인 페이지에 접속한다
    When 이메일 "no-user@example.com" 과 비밀번호 "ValidPass123!" 를 입력하고 로그인 버튼을 클릭한다
    Then "가입되지 않은 이메일입니다" 오류 메시지가 표시되어야 한다
    And 로그인 페이지에 그대로 머물러야 한다

  @outline @validation
  Scenario Outline: 로그인 입력값 유효성 검증
    Given 사용자가 로그인 페이지에 접속한다
    When 이메일 "<email>" 과 비밀번호 "<password>" 를 입력하고 로그인 버튼을 클릭한다
    Then "<message>" 안내가 표시되어야 한다
    And 로그인 결과는 "<result>" 여야 한다

    Examples:
      | email               | password      | message                    | result |
      |                     | ValidPass123! | 이메일을 입력해주세요         | 실패   |
      | qa.user@example.com |               | 비밀번호를 입력해주세요        | 실패   |
      | invalid-email       | ValidPass123! | 올바른 이메일 형식이 아닙니다   | 실패   |

@mock @mypage
Feature: 마이페이지 기능 검증

  @guard
  Scenario: 비로그인 사용자의 마이페이지 접근 차단
    Given 사용자가 로그인하지 않은 상태이다
    When 사용자가 "/mypage" URL로 직접 접근한다
    Then 로그인 페이지로 리다이렉트되어야 한다
    And 안내 문구 "로그인이 필요한 서비스입니다" 가 표시되어야 한다

  Scenario: 로그인 사용자의 마이페이지 기본 정보 확인
    Given 사용자가 정상 로그인 후 마이페이지에 진입해 있다
    Then 마이페이지 제목 "내 정보" 가 보여야 한다
    And 계정 이메일 "qa.user@example.com" 이 읽기 전용으로 표시되어야 한다
    And 가입일 정보가 YYYY-MM-DD 형식으로 표시되어야 한다

  @outline @profile
  Scenario Outline: 마이페이지 닉네임 수정 검증
    Given 사용자가 로그인 후 프로필 설정 섹션에 진입해 있다
    When 닉네임을 "<nickname>" 으로 변경하고 저장한다
    Then "<message>" 메시지가 보여야 한다
    And 저장 결과는 "<result>" 여야 한다

    Examples:
      | nickname    | message                       | result |
      | QA러너       | 프로필이 저장되었습니다         | 성공   |
      | ab          | 닉네임은 3자 이상이어야 합니다   | 실패   |
      | 테스트유저01 | 프로필이 저장되었습니다         | 성공   |

  @outline @security
  Scenario Outline: 비밀번호 변경 정책 검증
    Given 사용자가 로그인 후 보안 설정 섹션에 진입해 있다
    When 현재 비밀번호 "<currentPassword>" 와 새 비밀번호 "<newPassword>" 를 입력해 변경을 시도한다
    Then "<message>" 메시지가 표시되어야 한다
    And 변경 결과는 "<result>" 여야 한다

    Examples:
      | currentPassword | newPassword      | message                                      | result |
      | ValidPass123!   | NewValid456!     | 비밀번호가 성공적으로 변경되었습니다          | 성공   |
      | ValidPass123!   | 1234             | 비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다 | 실패   |
      | WrongPass999!   | NewValid456!     | 현재 비밀번호가 일치하지 않습니다              | 실패   |

  @outline @preferences
  Scenario Outline: 알림 수신 설정 토글 검증
    Given 사용자가 로그인 후 알림 설정 섹션에 진입해 있다
    When 이메일 알림을 "<emailNotice>" 로 설정하고 저장한다
    And 푸시 알림을 "<pushNotice>" 로 설정하고 저장한다
    Then "설정이 저장되었습니다" 토스트 메시지가 표시되어야 한다
    And 새로고침 후 이메일 알림은 "<emailNotice>" 상태를 유지해야 한다
    And 새로고침 후 푸시 알림은 "<pushNotice>" 상태를 유지해야 한다

    Examples:
      | emailNotice | pushNotice |
      | ON          | ON         |
      | ON          | OFF        |
      | OFF         | OFF        |

  @negative
  Scenario: 프로필 이미지 업로드 용량 초과 실패
    Given 사용자가 로그인 후 프로필 설정 섹션에 진입해 있다
    When 10MB 초과 이미지 파일을 업로드한다
    Then "이미지 용량은 5MB 이하만 가능합니다" 메시지가 표시되어야 한다
    And 기존 프로필 이미지는 변경되지 않아야 한다

  Scenario: 변경사항 저장 없이 페이지 이탈 시 경고 표시
    Given 사용자가 로그인 후 마이페이지 편집 모드에 있다
    And 닉네임 입력값을 수정했지만 저장하지 않았다
    When 사용자가 브라우저 뒤로가기를 시도한다
    Then "저장하지 않은 변경사항이 있습니다" 확인 팝업이 표시되어야 한다

  @danger
  Scenario: 회원 탈퇴 확인 플로우 진입
    Given 사용자가 로그인 후 계정 관리 섹션에 진입해 있다
    When 사용자가 "회원 탈퇴" 버튼을 클릭한다
    Then 탈퇴 안내 문구와 재확인 체크박스가 표시되어야 한다
    And 즉시 탈퇴가 실행되지 않아야 한다

@mock @signup
Feature: 회원가입 기능 검증

  Scenario: 신규 사용자 회원가입 성공
    Given 사용자가 회원가입 페이지에 접속한다
    When 이메일 "new.user@example.com" 과 비밀번호 "Welcome123!" 를 입력한다
    And 비밀번호 확인에 "Welcome123!" 를 입력한다
    And 서비스 이용약관과 개인정보 처리방침에 동의한다
    And 회원가입 버튼을 클릭한다
    Then "회원가입이 완료되었습니다" 메시지가 표시되어야 한다
    And 로그인 페이지 또는 온보딩 페이지로 이동해야 한다

  @negative
  Scenario: 이미 가입된 이메일로 회원가입 실패
    Given 사용자가 회원가입 페이지에 접속한다
    When 이메일 "qa.user@example.com" 과 비밀번호 "Welcome123!" 를 입력한다
    And 비밀번호 확인에 "Welcome123!" 를 입력한다
    And 필수 약관에 동의한다
    And 회원가입 버튼을 클릭한다
    Then "이미 사용 중인 이메일입니다" 오류 메시지가 표시되어야 한다
    And 회원가입 페이지에 그대로 머물러야 한다

  @outline @validation
  Scenario Outline: 회원가입 입력값 유효성 검증
    Given 사용자가 회원가입 페이지에 접속한다
    When 이메일 "<email>" 과 비밀번호 "<password>" 와 비밀번호 확인 "<confirmPassword>" 를 입력한다
    And 필수 약관 동의 여부를 "<agree>" 로 설정한다
    And 회원가입 버튼을 클릭한다
    Then "<message>" 메시지가 표시되어야 한다
    And 회원가입 결과는 "<result>" 여야 한다

    Examples:
      | email                | password     | confirmPassword | agree | message                          | result |
      | invalid-email        | Welcome123!  | Welcome123!     | Y     | 올바른 이메일 형식이 아닙니다       | 실패   |
      | new.user@example.com | 1234         | 1234            | Y     | 비밀번호는 8자 이상이어야 합니다     | 실패   |
      | new.user@example.com | Welcome123!  | Mismatch123!    | Y     | 비밀번호 확인이 일치하지 않습니다    | 실패   |
      | new.user@example.com | Welcome123!  | Welcome123!     | N     | 필수 약관에 동의해야 가입할 수 있습니다 | 실패   |

  Scenario: 이메일 인증 전 계정 상태 안내
    Given 사용자가 회원가입을 완료했지만 이메일 인증을 하지 않았다
    When 사용자가 로그인 시도를 한다
    Then "이메일 인증 후 로그인할 수 있습니다" 안내 메시지가 표시되어야 한다
    And 이메일 재전송 버튼이 노출되어야 한다
