import {readFileSync,writeFileSync} from 'node:fs';
const file='apps/api/src/content/data/content.v1.json';const seed=JSON.parse(readFileSync(file,'utf8'));
const rows=[
['water','我要水。','我要水。','I want water.','wǒ yào shuǐ',[3],'shuǐ','水'],
['tea','我喝茶。','我喝茶。','I drink tea.','wǒ hē chá',[2],'chá','茶'],
['rice','这是米。','這是米。','This is rice.','zhè shì mǐ',[3],'mǐ','米'],
['person','他是好人。','他是好人。','He is a good person.','tā shì hǎo rén',[2],'rén','人'],
['big','这个很大。','這個很大。','This is big.','zhè ge hěn dà',[4],'dà','大'],
['sky','天很蓝。','天很藍。','The sky is blue.','tiān hěn lán',[1],'tiān','天'],
['cup','请给我一个杯子。','請給我一個杯子。','Please give me a cup.','qǐng gěi wǒ yí ge bēi zi',[1,5],'bēi zi','杯'],
['bottle','请给我一个瓶子。','請給我一個瓶子。','Please give me a bottle.','qǐng gěi wǒ yí ge píng zi',[2,5],'píng zi','瓶'],
['buy','我想购买这个杯子。','我想購買這個杯子。','I would like to purchase this cup.','wǒ xiǎng gòu mǎi zhè ge bēi zi',[4,3],'gòu mǎi','购'],
['prepare','我准备明天去买茶。','我準備明天去買茶。','I plan to buy tea tomorrow.','wǒ zhǔn bèi míng tiān qù mǎi chá',[3,4],'zhǔn bèi','准'],
['one-cup','我只要一杯茶。','我只要一杯茶。','I only want one cup of tea.','wǒ zhǐ yào yì bēi chá',[4,1],'yì bēi','一'],
['very-good','这杯茶很好。','這杯茶很好。','This cup of tea is very good.','zhè bēi chá hén hǎo',[2,3],'hén hǎo','很'],
['consider','我们需要考虑这个方案是否可行。','我們需要考慮這個方案是否可行。','We need to consider whether this plan is feasible.','wǒ men xū yào kǎo lǜ zhè ge fāng àn shì fǒu kě xíng',[3,4],'kǎo lǜ','考'],
['deliberate','正式回复之前，请仔细斟酌措辞。','正式回覆之前，請仔細斟酌措辭。','Before replying formally, please weigh your wording carefully.','zhèng shì huí fù zhī qián qǐng zǐ xì zhēn zhuó cuò cí',[1,2],'zhēn zhuó','斟'],
['discuss','这件事我想先和家人商量一下。','這件事我想先和家人商量一下。','I would like to discuss this matter with my family first.','zhè jiàn shì wǒ xiǎng xiān hé jiā rén shāng liang yí xià',[1,5],'shāng liang','商'],
['negotiate','双方代表将协商合同的具体条款。','雙方代表將協商合同的具體條款。','Representatives of both sides will negotiate the specific contract terms.','shuāng fāng dài biǎo jiāng xié shāng hé tong de jù tǐ tiáo kuǎn',[2,1],'xié shāng','协'],
['decide','经过充分讨论，我们决定推迟会议。','經過充分討論，我們決定推遲會議。','After thorough discussion, we decided to postpone the meeting.','jīng guò chōng fèn tǎo lùn wǒ men jué dìng tuī chí huì yì',[2,4],'jué dìng','决'],
['think-twice','面对如此重要的选择，我们应当三思而后行。','面對如此重要的選擇，我們應當三思而後行。','Faced with such an important choice, we should think carefully before acting.','miàn duì rú cǐ zhòng yào de xuǎn zé wǒ men yīng dāng sān sī ér hòu xíng',[1,1,2,4,2],'sān sī ér hòu xíng','三']
];
const marks=['āáǎà','ēéěè','īíǐì','ōóǒò','ūúǔù','ǖǘǚǜ'];
const loc=(en,hans,hant=hans)=>({en,'zh-Hans':hans,'zh-Hant':hant});
for(const [id,hans,hant,en,sentencePinyin,spokenTones,spokenPinyin,traceCharacter] of rows){
 const word=seed.vocabulary.find(w=>w.id===id);const variants=new Set([word.pinyin]);
 for(let i=0;i<word.pinyin.length;i++){const group=marks.find(g=>g.includes(word.pinyin[i]));if(group)for(const c of group)variants.add(word.pinyin.slice(0,i)+c+word.pinyin.slice(i+1));}
 for(const other of seed.vocabulary)variants.add(other.pinyin);
 const sandhi=id==='very-good'?'In 很好, the first third tone is spoken as a rising second tone.':id==='one-cup'?'一 changes to fourth tone before the first tone in 杯.':'Listen to the whole word and distinguish each syllable.';
 word.practice={spokenTones,spokenPinyin,traceCharacter,sentence:loc(en,hans,hant),sentencePinyin,pinyinChoices:[...variants].slice(0,8),
 explanation:loc(word.simplified+' · '+word.pinyin+'. '+sandhi+' Context: '+en,word.simplified+' · '+word.pinyin+'。'+(id==='very-good'?'两个三声相连，前一个变为二声。':id==='one-cup'?'“一”在一声前读四声。':'注意每个音节的声调和语境。')+hans,word.traditional+' · '+word.pinyin+'。'+(id==='very-good'?'兩個三聲相連，前一個變為二聲。':id==='one-cup'?'「一」在一聲前讀四聲。':'注意每個音節的聲調和語境。')+hant)};
}
seed.contentVersion='0.0.2';
writeFileSync(file,JSON.stringify(seed,null,2)+'\n');
let contracts=readFileSync('packages/contracts/src/index.ts','utf8');
contracts=contracts.replace('export interface Vocabulary {',`export interface PracticeContent {
 readonly spokenTones: readonly number[];
 readonly spokenPinyin: string;
 readonly traceCharacter: string;
 readonly sentence: LocalizedText;
 readonly sentencePinyin: string;
 readonly pinyinChoices: readonly string[];
 readonly explanation: LocalizedText;
}
export interface Vocabulary {
 readonly practice?: PracticeContent;`);
contracts=contracts.replace('export interface GameRound {','export interface GameRound {\n  readonly vocabularyId: string;');
contracts=contracts.replace('export interface RoundResult {','export interface RoundResult {\n  readonly vocabularyId: string;');
contracts=contracts.replace('export interface LocalProgress {','export interface LocalProgress {\n  readonly lastActivityDate?: string;\n  readonly completedGameKeys?: readonly string[];\n  readonly awardedSessionIds?: readonly string[];');
writeFileSync('packages/contracts/src/index.ts',contracts);
let schema=readFileSync('apps/api/src/content/seed-schema.ts','utf8');
schema=schema.replace('class VocabularyDto extends IdentifiedDto {',`class PracticeDto {
 @IsArray() @ArrayMinSize(1) @IsIn([1,2,3,4,5], {each:true}) spokenTones!: number[];
 @IsString() @Matches(/\\S/) spokenPinyin!: string;
 @IsString() @Matches(/^\\p{Script=Han}$/u) traceCharacter!: string;
 @IsObject() @ValidateNested() @Type(() => LocalizedTextDto) sentence!: LocalizedTextDto;
 @IsString() @Matches(/\\S/) sentencePinyin!: string;
 @IsArray() @ArrayMinSize(6) @ArrayUnique() @IsString({each:true}) pinyinChoices!: string[];
 @IsObject() @ValidateNested() @Type(() => LocalizedTextDto) explanation!: LocalizedTextDto;
}
class VocabularyDto extends IdentifiedDto {
 @ValidateIf((_o,v:unknown)=>v!==undefined) @IsObject() @ValidateNested() @Type(() => PracticeDto) practice?: PracticeDto;`);
schema=schema.replace('for (const id of round.vocabularyIds) {',`for (const id of round.vocabularyIds) {
        const word = dto.vocabulary.find(v=>v.id===id);
        if (word && !word.practice) errors.push(id+': missing practice content');
        if (word?.practice && !word.practice.pinyinChoices.includes(word.pinyin)) errors.push(id+': pinyin answer absent from choices');`);
writeFileSync('apps/api/src/content/seed-schema.ts',schema);
let test=readFileSync('apps/api/src/adapters/static-content/static-content.repository.test.ts','utf8').replace('toHaveLength(3)','toHaveLength(4)');
writeFileSync('apps/api/src/adapters/static-content/static-content.repository.test.ts',test);
