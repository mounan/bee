const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const APP = getApp()
APP.configLoadOK = () => {
  
}

Page({
  data: {
    addressList: [],
    addressEdit: false,
    cancelBtn: false,
    addressData: {}
  },
  // 添加地址
  addAddress: function() {
    this.setData({
      addressEdit: true,
      cancelBtn: true,
      id: null,
      addressData: {}
    })
  },
  // 取消编辑
  editCancel: function(){
    this.setData({
      addressEdit: false,         
    })
  },
  // 编辑地址
  async editAddress(e) {
    // wx.navigateTo({
    //   url: "/pages/address-add/index?id=" + e.currentTarget.dataset.id
    // })
    var id = e.currentTarget.dataset.id    
    this.setData({ 
      addressEdit: true,
      cancelBtn: false,
      id:id,
    })
    if (id) { // 修改初始化数据库数据
      const res = await WXAPI.addressDetail(wx.getStorageSync('token'), id)
      if (res.code == 0) {
        var addressData = res.data.info
        console.log(addressData)
        var address = addressData.address
        this.setData({
          id: id,
          addressData: res.data.info,  
          address: res.data.info.address
        })
               
      } else {
        wx.showModal({
          confirmText: this.data.$t.common.confirm,
          cancelText: this.data.$t.common.cancel,
          content: this.data.$t.ad_index.apiError,
          showCancel: false
        })
      }
    }
    
  }, 
  // 选中地址
  selectTap: function(e) {
    var id = e.currentTarget.dataset.id;
    WXAPI.updateAddress({
      token: wx.getStorageSync('token'),
      id: id,
      isDefault: 'true'
    }).then(function(res) {
      wx.navigateBack({})
    })
  },
  // 删除地址按钮
  deleteAddress: function (e) {
    const _this = this
    const id = e.currentTarget.dataset.id;
    console.log(id)
    wx.showModal({
      confirmText: this.data.$t.common.confirm,
      cancelText: this.data.$t.common.cancel,
      content: this.data.$t.ad_index.deleteProfile,
      success: function (res) {
        if (res.confirm) {
          WXAPI.deleteAddress(wx.getStorageSync('token'), id).then(function () {
            _this.setData({
              addressEdit: false,
              cancelBtn: false,
            })
            _this.initShippingAddress()
          })
        }
      }
    })
  },
  // 微信读取
  readFromWx : function () {
    const _this = this
    wx.chooseAddress({
      success: function (res) {
        console.log(res)
        _this.setData({
          wxaddress: res
        });
      }
    })
  },  
  // 获取地址列表
  async initShippingAddress() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.queryAddress(wx.getStorageSync('token'))
    wx.hideLoading({
      success: (res) => {},
    })
    if (res.code == 0) {
      this.setData({
        addressList: res.data
      });
    } else {
      this.setData({
        addressList: null
      });
    }
  },   
  linkManChange(e) {
    const addressData = this.data.addressData
    addressData.linkMan = e.detail
    this.setData({
      addressData
    })
  },
  mobileChange(e) {
    const addressData = this.data.addressData
    addressData.mobile = e.detail
    this.setData({
      addressData
    })
  },
  addressChange(e) {
    const addressData = this.data.addressData
    addressData.address = e.detail
    this.setData({
      addressData
    })
  },
  // 保存按钮
  async bindSave() {    
    const linkMan = this.data.addressData.linkMan
    const address = this.data.addressData.address
    const mobile = this.data.addressData.mobile

    if (!linkMan){
      wx.showToast({
        title: this.data.$t.ad_index.linkManPlaceholder,
        icon: 'none',        
      })
      return
    }
    if (!mobile){
      wx.showToast({
        title: this.data.$t.ad_index.mobilePlaceholder,
        icon: 'none',        
      })
      return
    }
    if (!address){
      wx.showToast({
        title: this.data.$t.ad_index.address,
        icon: 'none',       
      })
      return
    }
    
    const postData = {
      token: wx.getStorageSync('token'),
      linkMan: linkMan,
      address: address,
      mobile: mobile,
      isDefault: 'true',
      latitude: 0,
      longitude: 0
    }     

    postData.provinceId = 0
    postData.cityId = 0
    postData.districtId = 0

    let apiResult
    console.log(this.data.id)
    if (this.data.id) {
      postData.id = this.data.id
      apiResult = await WXAPI.updateAddress(postData)
    } else {
      apiResult = await WXAPI.addAddress(postData)
    }
    if (apiResult.code != 0) {
      // 登录错误 
      wx.hideLoading();
      wx.showToast({
        title: apiResult.msg,
        icon: 'none'
      })
      return;
    } else {
      this.setData({
        addressEdit: false,
        cancelBtn: false,
      })
      this.initShippingAddress()
    }    
    
  },
  onLoad(e) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.ad_index.title,
    })
    const _this = this
    if (e.id) { // 修改初始化数据库数据
      WXAPI.addressDetail(e.id, wx.getStorageSync('token')).then(function (res) {
        if (res.code === 0) {
          _this.setData({
            id: e.id,
            addressData: res.data,
          });
          return;
        } else {
          wx.showModal({
            confirmText: this.data.$t.common.confirm,
            cancelText: this.data.$t.common.cancel,
            content: this.data.$t.ad_index.apiError,
            showCancel: false
          })
        }
      })
    }
  },
  onShow: function() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.initShippingAddress();
      } else {
        wx.showModal({
          confirmText: this.data.$t.common.confirm,
          cancelText: this.data.$t.common.cancel,
          content: this.data.$t.auth.needLogin,
          showCancel: false,
          success: () => {
            wx.navigateBack()
          }
        })
      }
    })
  },
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const addressData = this.data.addressData
        addressData.address = res.address + res.name
        addressData.latitude = res.latitude
        addressData.longitude = res.longitude
        this.setData({
          addressData
        })
      },
      fail: (e) => {
        console.error(e)
      },
    })
  },
})

