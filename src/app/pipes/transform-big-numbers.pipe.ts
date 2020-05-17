import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transformBigNumbers'
})
export class TransformBigNumbersPipe implements PipeTransform {

  transform(value: number): string | null {

    const strValue = value.toString();
    let valueOutput = strValue;

    if (value < 1000) {
      valueOutput = `${strValue}`;
    }
    if ((value >= 1000) && (value < 10000)) {
      valueOutput = `+${strValue.substr(0, 1)}K`;
    }
    if ((value >= 10000) && (value < 100000)) {
      valueOutput = `+${strValue.substr(0, 2)}K`;
    }
    if ((value >= 100000) && (value < 1000000)) {
      valueOutput = `+${strValue.substr(0, 3)}K`;
    }
    if (value > 1000000) {
      valueOutput = `+${strValue.substr(0, 4)}M`;
    }

    return valueOutput;
  }

}
