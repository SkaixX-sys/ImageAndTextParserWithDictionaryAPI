import { UseInterceptors, UploadedFile } from '@nestjs/common/decorators';
import { Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiProperty } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { createWorker } from "tesseract.js";
import { HttpService } from '@nestjs/axios';

class FileUploadDto {
  @ApiProperty({ type: "string", format: "binary" })
  file: any
}


@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly httpService: HttpService) { }

  @Post('upload')
  @ApiOkResponse({
    type: FileUploadDto
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Screenshots with words',
    type: FileUploadDto,
  })

  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      const worker = await createWorker("eng");
      const recognizeResult = await worker.recognize(file.buffer);
      const recognizeResultWithoutWhitespace = recognizeResult.data.text.replace("\n", " ")
      let SetWithUniqueWords = new Set()
      const wordsArray = recognizeResultWithoutWhitespace.split(" ")
        .map(word => word.replace(/[^\w\s]|_/g, ""))
        .filter(word => word !== "");

      console.log(wordsArray);

      for (let item of wordsArray) {
        let potentialUniqueWord = item.trim().toLowerCase()
        SetWithUniqueWords.add(potentialUniqueWord)
        if (SetWithUniqueWords.has(potentialUniqueWord)) {
          const dictionaryResult = await this.httpService.axiosRef.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${potentialUniqueWord}`);
          const arrayOfDefinitions = dictionaryResult.data[0].meanings

          for (let index = 0; index < arrayOfDefinitions.length; index++) {
            const { partOfSpeech, definitions } = arrayOfDefinitions[index]
            console.log("слово: " + potentialUniqueWord);
            if (partOfSpeech === "interjection") {

            }
            if (partOfSpeech === "noun") {
              console.log("существительное: ")
              console.log("Объяснение на английском: " + definitions[0].definition);
            }
            if (partOfSpeech === "verb") {
              console.log("глагол: ")
              console.log("Объяснение на английском: " + definitions[0].definition);
            }
            if (partOfSpeech === "adjective") {
              console.log("прилагательное: ")
              console.log("Объяснение на английском: " + definitions[0].definition);
            }
            if (partOfSpeech === "preposition") {
              console.log("предлог: ")
              console.log("Объяснение на английском: " + definitions[0].definition);
            }
          }
        } else {
          return
        }

      }

      console.log("SetWithUniqueWords" + JSON.stringify(SetWithUniqueWords));


      await worker.terminate();
    } catch (error) {
      console.error(error);
    }
  }

}
