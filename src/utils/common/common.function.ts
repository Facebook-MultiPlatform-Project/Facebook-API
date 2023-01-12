/**
 * Class chứa các hàm helper
 * @author : Tr4nLa4m (05-12-2022)
 */
export class CommonMethods {
  /**
   * Sinh mã ngẫu nhiên n chữ số
   * @author : Tr4nLa4m (05-12-2022)
   * @param n số chữ số
   * @returns
   */
  public generateCode = (n: number) => {
    var add = 1,
      max = 12 - add; // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

    if (n > max) {
      return this.generateCode(max) + this.generateCode(n - max);
    }

    max = Math.pow(10, n + add);
    var min = max / 10; // Math.pow(10, n) basically
    var number = Math.floor(Math.random() * (max - min + 1)) + min;

    return ('' + number).substring(add);
  };

  /**
   * Thêm số phút vào thời gian
   * @author : Tr4nLa4m (05-12-2022)
   * @param date ngày
   * @param minutes số phút
   * @returns
   */
  public addMinutesToDate = (date: Date, minutes: number) => {
    return new Date(date.getTime() + minutes * 60000);
  };

  /**
   * Lấy entity với các thuộc tính định trước
   * @author : Tr4nLa4m (05-11-2022)
   * @param entity entity
   * @param pros danh sách các thuộc tính
   */
  public getLessEntityProperties = (entity: any, pros: Array<string>) => {
    const res = {};
    pros.forEach((property) => {
      if (entity.hasOwnProperty(property)) {
        res[property] = entity[property];
      } else {
        console.warn(
          `Property ${property} is not define in type ${typeof entity}`,
        );
        res[property] = null;
      }
    });

    return res;
  };

  /**
   * Tách chuỗi thành mảng
   * @param str chuỗi cần tách
   * @param separator ký tự tách
   * @returns 
   */
  public getArrayValueFromString = (str : string, separator : string) => {
    return str.split(separator);
  }

}
