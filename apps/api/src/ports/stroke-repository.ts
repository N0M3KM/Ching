export const STROKE_REPOSITORY=Symbol('STROKE_REPOSITORY');
export interface StrokeRepository {find(character:string):unknown;}
