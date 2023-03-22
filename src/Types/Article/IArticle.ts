import IUser from '../User/IUser'
import IBaseModel from '../IBaseModel'
import ICompany from '../Company/ICompany'
import IAsset from '../Asset/IAsset'
import IAuthor from './IAuthor';

type IArticle = IBaseModel & {
  title: string
  content?: string | null
  excerpt?: string | null
  authorId?: string | null
  coverAssetId?: string | null
  noOfVisits: number | null
  companyId: string
  oldId: string | null
  slug: string | null
  isPublished?: boolean
  publishedAt?: Date | null
  publishedById?: string | null
  CoverAsset?: IAsset
  Company?: ICompany
  CreatedBy?: IUser
  UpdatedBy?: IUser
  Author?: IAuthor;
}

export default IArticle
