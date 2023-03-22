import IUser from './User/IUser'

type IBaseModel = {
  id?: string
  isActive?: boolean | number
  createdAt?: Date
  createdById?: string
  updatedAt?: Date
  updatedById?: string
  CreatedBy?: IUser
  UpdatedBy?: IUser
}

export default IBaseModel
