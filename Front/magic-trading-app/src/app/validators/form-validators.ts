import { AbstractControl, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Password strength validator
   * Requirements:
   * - At least 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   */
  static passwordStrength(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // Check minimum length
      const hasMinLength = value.length >= 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecialChar = /[@$!%*?&]/.test(value);

      const errors = {
        minLength: !hasMinLength,
        upperCase: !hasUpperCase,
        lowerCase: !hasLowerCase,
        number: !hasNumber,
        specialChar: !hasSpecialChar
      };

      return Object.values(errors).some(Boolean)
        ? { passwordStrength: errors }
        : null;
    };
  }

  /**
   * Username format validator
   * Requirements:
   * - 3-30 characters
   * - Only alphanumeric characters and underscores
   */
  static usernameFormat(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const validUsername = /^[a-zA-Z0-9_]{3,30}$/.test(value);
      return validUsername ? null : { invalidUsername: true };
    };
  }
}
