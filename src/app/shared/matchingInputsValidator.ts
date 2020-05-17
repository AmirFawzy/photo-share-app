import { ValidatorFn, ValidationErrors, FormGroup } from '@angular/forms';

export function matchingInputsValidator(firstKey: string, secondKey: string, codeName: string): ValidatorFn {
  return (group: FormGroup): ValidationErrors | undefined => {
    if (group.controls[firstKey].value !== group.controls[secondKey].value) {
      return {
        [codeName]: true
      };
    }
    return;
  };
}
