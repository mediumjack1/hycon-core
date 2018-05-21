import * as Base58 from 'base-58'
import { } from 'jasmine'
import { Address } from '../src/common/address'

describe('Address', () => {
    let address: Address

    it('Should assign a buffer from a string', () => {
        const str = 'PhineasGageC5jJ'
        address = new Address(str)
        expect(address).toBeDefined()
    })

    it('Should assign an address from a Uint8Array', () => {
        const add = new Uint8Array(20)
        address = new Address(add)
        expect(address).toBeDefined()
    })

    it('Should throw an error if the checksum does not match', () => {
        const str = 'Hbcdefghijk8XVp'
        function result() {
            address = new Address(str)

        }
        expect(result).toThrowError()
    })

    it('toString(): Should return a base 58 encoded string representation of the address', () => {
        const str = 'PhineasGageC5jJ'
        const encodeSpy = spyOn(Base58, 'encode').and.returnValue('TestStringReturn')
        const decodeSpy = spyOn(Base58, 'decode').and.returnValue(new Uint8Array(0))
        const sliceSpy = spyOn(String.prototype, 'slice').and.returnValue('slice')
        address = new Address(str)
        const add = address.toString()
        expect(encodeSpy).toHaveBeenCalledTimes(3)
        expect(sliceSpy).toHaveBeenCalled()
    })

    it('equals(): Should return false if address lengths do not match', () => {
        const add1 = new Uint8Array(15)
        const add2 = new Uint8Array(20)
        address = new Address(add1)
        const address2 = new Address(add2)
        expect(address.equals(address2)).toBeFalsy()
        expect(address2.equals(address)).toBeFalsy()
    })

    it('equals(): Should return false if the address is not equal', () => {
        const add1 = new Uint8Array(20)
        const add2 = new Uint8Array(20)
        add2[18] = 7
        address = new Address(add1)
        const address2 = new Address(add2)
        expect(address.equals(address2)).toBeFalsy()
        expect(address2.equals(address)).toBeFalsy()
    })

    it('equals(): Should return true if the addresses are the same', () => {
        const str = 'PhineasGageC5jJ'
        address = new Address(str)
        const address2 = new Address(str)
        expect(address.equals(address2)).toBeTruthy()
        expect(address2.equals(address)).toBeTruthy()
    })

    it('decode(string) : should slice from of character H and decode that address', () => {
        const decodeSpy = spyOn(Base58, 'decode').and.returnValue(new Uint8Array(0))
        const sliceSpy = spyOn(String.prototype, 'slice').and.returnValue('slice')
        Address.decode('HAddressstringData')
        expect(sliceSpy).toHaveBeenCalledTimes(1)
        expect(decodeSpy).toHaveBeenCalledTimes(1)
    })
})
