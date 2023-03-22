import React from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'

const CompanyName = styled.div`
  width: 100%;
  color: #fff;
  padding: 13px 18px;
  font-size: 24px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const CompanyLogo = () => {
  const { company } = useSelector((state: RootState) => state.auth)
  if (company === undefined || company === null || !('name' in company)) {
    return null
  }
  return <CompanyName>{company.name}</CompanyName>
}

export default CompanyLogo
