import {Injectable, Output, EventEmitter} from "angular2/core";
import {Http, Headers, RequestOptions} from 'angular2/http';
import {StoryBlock} from "../models/storyblock";
import 'rxjs/Rx';
import {Observable} from "rxjs/Observable";
import 'rxjs/add/operator/share';
import {Observer} from 'rxjs/Observer';
import {STORYBLOCKS} from "../mock/mock-storyblocks";
import {StoryBlockType} from "../models/storyblock-type";
import {STORYBLOCK_TYPES} from "../mock/mock-storyblock-types";
import {Configuration} from "../config/configuration";
import {LoggerService, DEBUG_LEVEL} from "./logger.service";

declare var pdfMake:any;

@Injectable()
export class StoryBlockService {
    private _exposedIndex = -1;
    indexChange$:Observable<number>;
    @Output() public addRequest$:EventEmitter<any> = new EventEmitter();
    private _observer:Observer<number>;

    constructor(private logger:LoggerService,
                public http:Http,
                private configuration:Configuration) {
        this.indexChange$ = new Observable(observer => this._observer = observer).share();
    }

    changeExposedIndex(index) {
        this._exposedIndex = index;
        this._observer.next(index);
    }

    getExposedIndex() {
        return this._exposedIndex;
    }

    getStoryBlocks(userId, storyId):Observable<StoryBlock[]> {
        return this.http.get(this.configuration.apiBasePath + '/story/' + userId + '/'+ storyId)
            .map(res => res.json())
            .catch(this.logger.errorCatcher());
    }

    saveStoryBlock(userId, storyId, storyBlock:StoryBlock):Observable<StoryBlock> {
        let headers = new Headers({
            'Content-Type': 'application/x-www-form-urlencoded'
        });

        let options = new RequestOptions({
            headers: headers
        });

        storyBlock.userId = userId;
        storyBlock.storyId = storyId;
        if (!!storyBlock._id) {
            storyBlock.createdAt = storyBlock.createdAt || (new Date());
            storyBlock.lastModifiedAt = (new Date());
            return this.http.put(this.configuration.apiBasePath + '/story/' + userId + '/'+ storyId + '/' + storyBlock._id, "data=" + JSON.stringify(storyBlock), options)
                .map(res => res.json())
                .catch(this.logger.errorCatcher());
        }
        else {
            storyBlock.createdAt = (new Date());
            storyBlock.lastModifiedAt = (new Date());
            return this.http.post(this.configuration.apiBasePath + '/story/' + userId + '/'+ storyId + '/', "data=" + JSON.stringify(storyBlock), options)
                .map(res => res.json())
                .catch(this.logger.errorCatcher());
        }
    }

    deleteStoryBlock(userId, storyId, storyBlock:StoryBlock):Observable<StoryBlock[]> {
        if (!!storyBlock._id) {
            return this.http.delete(this.configuration.apiBasePath + '/story/' + userId + '/'+ storyId + '/' + storyBlock._id)
                .map(res => res.json())
                .catch(this.logger.errorCatcher());
        }
        return null;
    }

    getStoryBlockTypes():StoryBlockType[] {
        return STORYBLOCK_TYPES;
    }

    getStoryBlockDefaultTypes():StoryBlockType[] {
        return STORYBLOCK_TYPES;
    }

    generateTestData(userId, storyId):Observable<StoryBlock[]> {
        this.logger.log(DEBUG_LEVEL.INFO, 'generateTestData', 'Creating temporary data for ' + userId);
        let headers = new Headers({
            'Content-Type': 'application/x-www-form-urlencoded'
        });

        let options = new RequestOptions({
            headers: headers
        });

        var blocks:StoryBlock[] = STORYBLOCKS;

        for (var i = 0; i < blocks.length; i++) {
            blocks[i].userId = userId;
            blocks[i].storyId = storyId;
            blocks[i].createdAt = (new Date());
            blocks[i].lastModifiedAt = (new Date());
        }

        return this.http.post(this.configuration.apiBasePath + '/story/' + userId + '/'+ storyId + '/', "data=" + JSON.stringify(blocks), options)
            .map(res => res.json())
            .catch(this.logger.errorCatcher());
    }

    downloadPdf(storyBlocks:StoryBlock[]) {
        function compare(a:StoryBlock, b:StoryBlock) {
            if (a.timePosition < b.timePosition)
                return -1;
            else if (a.timePosition > b.timePosition)
                return 1;
            else
                return 0;
        }

        storyBlocks.sort(compare);


        var docDefinition = {
            content: [],

            styles: {
                chapter: {
                    fontSize: 22,
                    bold: true,
                    margin: [0, 16, 0, 8]
                },
                paragraph: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 0, 0, 12]
                }
            }
        };

        for (var i = 0; i < storyBlocks.length; i++) {
            docDefinition.content.push(
                {
                    text: storyBlocks[i].title,
                    style: storyBlocks[i].type,
                }
            );
            docDefinition.content.push(
                storyBlocks[i].description
            );
        }

        pdfMake.createPdf(docDefinition).download();
    }

}