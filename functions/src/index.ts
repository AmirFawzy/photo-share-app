import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as spawn from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

/**
 *Generate thumbnail of any photo uploaded to the storage
 * download original photo from storage to `temdir` the os operation system 'the server'
 * resize and create thumbnail
 * upload from `tempFilePath` in `temdir` to the storage again
 * cleanup the temperory file to free up disk space
 */
exports.generateThumbnails = functions.storage.object().onFinalize(object => {
  if (object) {
    const fileBucket = object.bucket;
    const filePath = object.name;
    const contentType = object.contentType;
    const fileName = path.basename(filePath!);
    const bucket = admin.storage().bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const metadata = {
      contentType: contentType!,
      'Cache-Control': 'public,max-age=3600'
    };
    const thumbFileName500 = `thumb@500_${fileName}`;
    const thumbFilePath = path.join(path.dirname(filePath!), thumbFileName500);

    if (!contentType!.startsWith('image/')) {
      return;
    }

    if (fileName.startsWith('thumb@500_')) {
      return;
    }

    if (filePath!.includes('userPhoto')) {
      return;
    }

    return bucket.file(filePath!).download({
      destination: tempFilePath
    }).then(() => {
      return spawn.spawn('convert', [tempFilePath, '-thumbnail', '500x500>', tempFilePath]);
    }).then(() => {
      return bucket.upload(tempFilePath, {
        destination: thumbFilePath,
        metadata: metadata
      })
    }).then(() => {
      fs.unlinkSync(tempFilePath)
    });
  } else {
    return null;
  }
});

exports.onCreateAccountSettings = functions.firestore.document(`users/{userId}/accountSettings/{settings}`)
  .onCreate((snap, context) => {
    const newData = snap.data() as any;
    const userName = newData.userName;
    const userPhoto = newData.userPhoto;
    const email = newData.email;
    const socialLinks = newData.socialLinks;
    const aboutMe = newData.aboutMe;
    const country = newData.country;
    const hiring = newData.hiringAvailability;

    const { userId } = context.params;

    return db.doc(`users/${userId}`).set({
      userName: userName,
      userPhoto: userPhoto,
      email: email,
      likesNum: 0,
      viewsNum: 0,
      photosNum: 0,
      socialLinks: socialLinks,
      aboutMe: aboutMe,
      country: country,
      hiringAvailability: hiring,
      followersNum: 0,
      signoutTime: new Date()
    }, { merge: true })
      .then(() => console.log('Creating user settings is done!'))
      .catch(error => error)
  });

/**
 *When any update happen in user settings doc
 * make sure that there's a change happened in the data
 * if changed data was `userName` update all the user photos docs with the new `userName`
 * if changed data was `userPhoto` update all the user photos docs with the new `userPhoto`
 */
exports.updatePhotosOwnerNameAndUserData = functions.firestore.document(`users/{userId}/accountSettings/{settings}`)
  .onUpdate((change, context) => {

    const newData = change.after.data() as any;
    const previousData = change.before.data() as any;
    const { userId } = context.params;

    if (newData.userName !== previousData.userName) {

      const getPhotosDocs = db.collection('photos').where('owner.id', '==', `${userId}`).get();

      db.doc(`users/${userId}`)
        .set({ userName: newData.userName }, { merge: true })
        .then(() => console.log('update user info is done!'))
        .catch(error => error);

      getPhotosDocs.then(snapshot => {
        snapshot.docs.forEach(doc => {
          doc.ref.set({ owner: { userName: newData.userName } }, { merge: true })
            .then(() => {
              console.log('Edit done successfuly!');
            }).catch(error => {
              return error;
            });
        })
      }).catch(error => {
        return error;
      })

    }

    if (newData.userPhoto !== previousData.userPhoto) {

      const getDocs = db.collection('photos').where('owner.id', '==', `${userId}`).get();

      db.doc(`users/${userId}`)
        .set({ userPhoto: newData.userPhoto }, { merge: true })
        .then(() => console.log('update user info is done!'))
        .catch(error => error);

      getDocs.then(snapshot => {
        snapshot.docs.forEach(doc => {
          doc.ref.set({ owner: { profilePhoto: newData.userPhoto } }, { merge: true })
            .then(() => {
              console.log('Edit done successfuly!');
            }).catch(error => {
              return error;
            });
        })
      }).catch(error => {
        return error;
      })

    }

    if (newData.email !== previousData.email) {

      db.doc(`users/${userId}`)
        .set({ email: newData.email }, { merge: true })
        .then(() => console.log('Update "email" is done!'))
        .catch(error => error);

    }

    if ((newData.socialLinks.facebook !== previousData.socialLinks.facebook)
      || (newData.socialLinks.instagram !== previousData.socialLinks.instagram)
      || (newData.socialLinks.tumblr !== previousData.socialLinks.tumblr)
      || (newData.socialLinks.twitter !== previousData.socialLinks.twitter)
      || (newData.socialLinks.website !== previousData.socialLinks.website)) {

      db.doc(`users/${userId}`)
        .set({
          socialLinks: {
            facebook: newData.socialLinks.facebook,
            website: newData.socialLinks.website,
            instagram: newData.socialLinks.instagram,
            twitter: newData.socialLinks.twitter,
            tumblr: newData.socialLinks.tumblr
          }
        }, { merge: true })
        .then(() => console.log('update "socialLinks" is done!'))
        .catch(error => error);

    }

    if (newData.aboutMe !== previousData.aboutMe) {

      db.doc(`users/${userId}`)
        .set({ aboutMe: newData.aboutMe }, { merge: true })
        .then(() => console.log('"aboutMe" updated successfuly!'))
        .catch(error => error);

    }

    if (newData.country !== previousData.country) {

      db.doc(`users/${userId}`)
        .set({ country: newData.country }, { merge: true })
        .then(() => console.log('"country" updated successfuly!'))
        .catch(error => error);

    }

    if (newData.hiringAvailability !== previousData.hiringAvailability) {

      db.doc(`users/${userId}`)
        .set({ hiringAvailability: newData.hiringAvailability }, { merge: true })
        .then(() => console.log('"hiringAvailability" updated successfuly!'))
        .catch(error => error);

    }
  });

/**
 * Update Photo and it's thumbnails in storage and retrieve the new urls and new storage paths
 * to the 'uploadPlaceholder'
 */
exports.updatePhotoInStorageAndPlaceholderInDb = functions.firestore.document('uploadPlaceholder/{photoPlaceholder}')
  .onUpdate((snap, context) => {
    const newData = snap.after.data() as any;
    const oldData = snap.before.data() as any;
    // User id 'who upload this photo'
    const uid = newData.owner.id;
    // Photo document id 'docId' retrieve it from doc params 'photoPlaceholder'
    const { photoPlaceholder: photoId } = context.params;

    // if the title of the photo been updated
    if (newData.title !== oldData.title) {
      const newPhotoName = newData.title;
      const oldPhotoName = oldData.title;
      // Photo Extension '.jpg, .png...etc'
      const fileExt = oldData.photo.photoExt;
      // Photo path in storage
      const filePath = `users/${uid}/photos/${photoId}`;
      // Old photo path in storage
      const oldFilePath = `${filePath}/${oldPhotoName}.${fileExt}`;
      // new photo path in storage
      const newFilePath = `${filePath}/${newPhotoName}.${fileExt}`;
      // old thumbnail path in storage
      const oldThumbFilePath = `${filePath}/thumb@500_${oldPhotoName}.${fileExt}`;
      // new thumbnail path in storage
      const newThumbFilePath = `${filePath}/thumb@500_${newPhotoName}.${fileExt}`;

      // Change the name of the photo from old name to the new one
      return storage.bucket().file(`${oldFilePath}`).move(`${newFilePath}`)
        .then(() => {

          const config = {
            expires: '01-01-3000',
            action: 'read'
          } as any;

          // Get download url for the photo after change the name
          return storage.bucket().file(`${newFilePath}`).getSignedUrl(config).then(urls => {

            const downloadUrl = urls[0];

            // Add new downloadUrl and new storagePath to the database
            return db.doc(`uploadPlaceholder/${photoId}`)
              .set({ photo: { downloadUrl: downloadUrl, storagePath: `${newFilePath}` } }, { merge: true })
              .then(() => {

                // Delete the old thumbnail 'thumbnail with the old name'
                return storage.bucket().file(`${oldThumbFilePath}`).delete()
                  .then(() => console.log('thumb deleted!'))
                  .catch(error => error);

              })
              .then(() => {

                // Get download url for the new thumbnail
                return storage.bucket().file(`${newThumbFilePath}`).getSignedUrl(config).then(thumUrls => {

                  const thumdownloadUrl = thumUrls[0];

                  // Add new donwloadUrl and new storagePath of the thumbnail to database
                  return db.doc(`uploadPlaceholder/${photoId}`)
                    .set({ thumbnails: { thum500: { downloadUrl: thumdownloadUrl, storagePath: `${newThumbFilePath}` } } }, { merge: true })
                    .then(() => console.log('successfully done!'))
                    .catch(error => error)

                })
              })
              .catch(error => error);

          }).catch(error => error);

        })
        .catch(error => error);

    } else {
      return;
    }
  });

/**
 * Update Photo and it's thumbnails in storage and retrieve the new urls and new storage paths
 * to the 'photos'
 */
exports.updatePhotoInStorageAndPhotosInDb = functions.firestore.document('photos/{photo}')
  .onUpdate((snap, context) => {
    const newData = snap.after.data() as any;
    const oldData = snap.before.data() as any;
    // User id 'who upload this photo'
    const uid = newData.owner.id;
    // Photo document id 'docId' retrieve it from doc params 'photo'
    const { photo: photoId } = context.params;

    // if the title of the photo been updated
    if (newData.title !== oldData.title) {
      const newPhotoName = newData.title;
      const oldPhotoName = oldData.title;
      // Photo Extension '.jpg, .png...etc'
      const fileExt = oldData.photo.photoExt;
      // Photo path in storage
      const filePath = `users/${uid}/photos/${photoId}`;
      // Old photo path in storage
      const oldFilePath = `${filePath}/${oldPhotoName}.${fileExt}`;
      // new photo path in storage
      const newFilePath = `${filePath}/${newPhotoName}.${fileExt}`;
      // old thumbnail path in storage
      const oldThumbFilePath = `${filePath}/thumb@500_${oldPhotoName}.${fileExt}`;
      // new thumbnail path in storage
      const newThumbFilePath = `${filePath}/thumb@500_${newPhotoName}.${fileExt}`;

      // Change the name of the photo from old name to the new one
      return storage.bucket().file(`${oldFilePath}`).move(`${newFilePath}`)
        .then(() => {

          const config = {
            expires: '01-01-3000',
            action: 'read'
          } as any;

          // Get download url for the photo after change the name
          return storage.bucket().file(`${newFilePath}`).getSignedUrl(config).then(urls => {

            const downloadUrl = urls[0];

            // Add new downloadUrl and new storagePath to the database
            return db.doc(`photos/${photoId}`)
              .set({ photo: { downloadUrl: downloadUrl, storagePath: `${newFilePath}` } }, { merge: true })
              .then(() => {

                // Delete the old thumbnail 'thumbnail with the old name'
                return storage.bucket().file(`${oldThumbFilePath}`).delete()
                  .then(() => console.log('thumb deleted!'))
                  .catch(error => error);

              })
              .then(() => {

                // Get download url for the new thumbnail
                return storage.bucket().file(`${newThumbFilePath}`).getSignedUrl(config).then(thumUrls => {

                  const thumdownloadUrl = thumUrls[0];

                  // Add new donwloadUrl and new storagePath of the thumbnail to database
                  return db.doc(`photos/${photoId}`)
                    .set({ thumbnails: { thum500: { downloadUrl: thumdownloadUrl, storagePath: `${newThumbFilePath}` } } }, { merge: true })
                    .then(() => console.log('successfully done!'))
                    .catch(error => error)

                })
              })
              .catch(error => error);

          }).catch(error => error);

        })
        .catch(error => error);

    } else {
      return;
    }
  });

/**
 * copy the views number from views/views => views to photo doc
 */
exports.addViewsToPhotoDoc = functions.firestore.document('photos/{photo}/views/{views}')
  .onUpdate((change, context) => {
    const newData = (<any>change.after.data()).views;
    const { photo: photoId } = context.params;

    return db.doc(`photos/${photoId}`).get()
      .then(snapshot => {
        if (snapshot.exists) {
          db.doc(`photos/${photoId}`).set({ views: newData }, { merge: true })
            .then(() => console.log('updated done!'))
            .catch(error => error);
        } else {
          return;
        }
      })
      .catch(error => error);
  });

/**
 * copy the likes number from likes/likes => likes to photo doc
 */
exports.addLikesToPhotoDocAndUserGeneralData = functions.firestore.document('photos/{photo}/likes/{likes}')
  .onUpdate((change, context) => {
    const newData = (<any>change.after.data()).likes as string[];
    const { photo: photoId } = context.params;

    let totalLikes: number = 0;
    let userId: string;

    // db.doc(`photos/${photoId}`).set({ likes: newData.length }, { merge: true })
    //   .then(() => console.log('updated done!'))
    //   .catch(error => error);
    db.doc(`photos/${photoId}`).set({ likes: newData.length }, { merge: true })
      .then(() => {
        
        return db.doc(`photos/${photoId}`).get()
          .then(snapshot => userId = (<any>snapshot.data()).owner.id)
          .then(() => {

            return db.collection('photos').where('owner.id', '==', `${userId}`).get()
              .then(querySnapshot => {

                querySnapshot.forEach(doc => totalLikes = totalLikes + (<any>doc.data()).likes);

              })
              .then(() => {

                return db.doc(`users/${userId}`)
                  .set({ likesNum: totalLikes }, { merge: true })
                  .then(() => totalLikes = 0)
                  .catch(error => error);

              })
              .catch(error => error);

          })
      })
      .catch(error => error);
  });

/**
 * on write any job
 * get all docs in jobs collection and get the length of the docs
 * add 'jobsNum' document to db (- 1 here cuz the 'jobsNum' doc is inside the 'jobs' collection
 * so it count it as a doc which not intended behavior "we need just job docs")
 */
exports.addJobsNum = functions.firestore.document('jobs/{job}')
  .onWrite((snap, context) => {
    const jobsCollection = db.collection('jobs').get();

    return jobsCollection.then(snapshot => {

      const jobsNum = snapshot.docs.length;

      return db.doc('jobs/jobsNum')
        .set({ jobsNum: jobsNum - 1 }, { merge: true })
        .then(() => console.log('update "jobsNum" is done!'))
        .catch(error => error);

    }).catch(error => error);
  });

/**
 * on update followers[] in db
 * get followers length ... `followersNum`
 * set `followersNum` property in db with `merge` flag
 */
exports.addFollowersNum = functions.firestore.document('users/{userId}/followers/{followers}')
  .onUpdate((snap, context) => {
    const newData = snap.after.data() as any;
    const followersNum = (<string[]>newData.followersIds).length;
    const { userId } = context.params;

    return db.doc(`users/${userId}`)
      .set({ followersNum: followersNum }, { merge: true })
      .then(() => console.log('"followersNum" updated successfuly'))
      .catch(error => error);
  });

/**
 * on create photo (upload new photo)
 * get `photos` collection, then access to each doc
 * extract `owner.id` then push it to `photosOwnersIds[]`
 * then loop over `photosOwnersIds[]`, get photos docs that match `id`
 * get the docs length (photos docs number) 
 * then set `photosDocsLength` to `photosNum` property with `merge` flag in db
 */
exports.addPhotosNum = functions.firestore.document('photos/{photo}')
  .onCreate((snap, context) => {
    const photosOwnersIds: string[] = [];

    return db.collection('photos').get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          photosOwnersIds.push(doc.data().owner.id);
        });
      })
      .then(() => {
        photosOwnersIds.forEach(id => {
          return db.collection('photos').where('owner.id', '==', `${id}`).get()
            .then(querySnap => querySnap.docs.length)
            .then(photosDocsLength => {
              return db.doc(`users/${id}`)
                .set({ photosNum: photosDocsLength }, { merge: true })
                .then(() => console.log('doc successfully updated'))
                .catch(error => error);
            })
            .catch(error => error);
        })
      })
      .catch(error => error);
  });

/**
 * on update views of the photo
 * @constant {string} photo photo id
 * @var {number} totalViews total views number of all photo for specific user
 * @var {string} userId user id
 * get photo doc, then get the owner id (that's user id going to use to access to user general data)
 * then get all photos for that `userId` (user)
 * extract `views` property in photo doc and concatenat with `totalViews` other photo views
 * set `viewsNum` in general data in db to `totalViews' with `merge` flag
 * reset `totalViews`
 */
exports.addViewsNum = functions.firestore.document('photos/{photo}/views/{views}')
  .onUpdate((snap, context) => {
    const { photo: photoId } = context.params;
    let totalViews: number = 0;
    let userId: string;

    return db.doc(`photos/${photoId}`).get()
      .then(snapshot => userId = (<any>snapshot.data()).owner.id)
      .then(() => {
        return db.collection('photos').where('owner.id', '==', `${userId}`).get()
          .then(querySnapshot => {
            querySnapshot.forEach(doc => totalViews = totalViews + (<any>doc.data()).views);
          })
          .then(() => {
            return db.doc(`users/${userId}`)
              .set({ viewsNum: totalViews }, { merge: true })
              .then(() => totalViews = 0)
              .catch(error => error);
          })
          .catch(error => error);
      })
  });

// this function exist for reference
exports.addLikesNum = functions.firestore.document('photos/{photo}/likes/{likes}')
  .onUpdate((snap, context) => {
    return;
    // const { photo: photoId } = context.params;
    // let totalLikes: number = 0;
    // let userId: string;

    // return db.doc(`photos/${photoId}`).get()
    //   .then(snapshot => userId = (<any>snapshot.data()).owner.id)
    //   .then(() => {
    //     return db.collection('photos').where('owner.id', '==', `${userId}`).get()
    //       .then(querySnapshot => {
    //         querySnapshot.forEach(doc => totalLikes = totalLikes + (<any>doc.data()).likes);
    //       })
    //       .then(() => {
    //         return db.doc(`users/${userId}`)
    //           .set({ likesNum: totalLikes }, { merge: true })
    //           .then(() => totalLikes = 0)
    //           .catch(error => error);
    //       })
    //       .catch(error => error);
    //   })
  });

/**
 * set cover for collection on collection update
 * @constant {Collection} newValue data of collection
 * @constant {string} galleryId collection id
 * @constant {string[]} photos photos ids array
 * @constant {number} coverIdFromPhotos index of the photo in `photos[]`
 * 
 * add `photoId` to [cover.id] in collection in db
 * 
 * then get the photo doc from `photos Doc` in db
 * 
 * then set `downloadUrl` of this photo to the [cover.downloadUrl] in collection in db
 */
exports.setCoverIdForCollection = functions.firestore.document('galleries/{gallery}')
  .onUpdate((snap, context) => {
    const newValue = snap.after.data() as any;
    const { gallery: galleryId } = context.params;

    const photos = newValue.photos as string[];
    const coverIdFromPhotos = Math.floor(Math.random() * photos.length);

    if (photos.length) {
      return db.doc(`photos/${photos[coverIdFromPhotos]}`).get()
        .then(snapshot => {
          return db.doc(`galleries/${galleryId}`).set({
            cover: {
              id: photos[coverIdFromPhotos],
              thumUrl: (<any>snapshot.data()).thumbnails.thum500.downloadUrl,
              originalUrl: (<any>snapshot.data()).photo.downloadUrl
            }
          }, { merge: true })
            .then(() => console.log('cover downloadUrl updated!'))
            .catch(error => console.log(error))
        })
        .catch(error => console.log(error));
    } else {
      return db.doc(`galleries/${galleryId}`).set({
        cover: {
          id: '',
          thumUrl: '',
          originalUrl: ''
        }
      }, { merge: true })
        .then(() => console.log('cover updated!'))
        .catch(error => console.log(error));
    }
  });

exports.deleteUserData = functions.auth.user()
  .onDelete((user, context) => {
    const { uid } = user;

    return db.doc(`users/${uid}/accountSettings/settings`).get()
      .then(snapshot => {
        if (snapshot.exists) {

          return storage.bucket().file(snapshot.data()!.userPhotoStoragePath).delete()
            .then(() => {

              snapshot.ref.delete()
                .then(() => 'accountSettings deleted successfully')
                .catch(error => error);

            })
            .catch(error => error);

        }
        return;
      })
      .then(() => {

        return db.doc(`users/${uid}/generalData/data`).delete()
          .then(() => console.log('generalData deleted successfully'))
          .catch(error => error);

      })
      .then(() => {

        return db.doc(`users/${uid}/friends/friends`).delete()
          .then(() => console.log('friends deleted successfully'))
          .catch(error => error);

      })
      .then(() => {

        return db.doc(`users/${uid}/followers/followers`).delete()
          .then(() => console.log('followers deleted successfully'))
          .catch(error => error);

      })
      .then(() => {

        return db.collection(`users/${uid}/feeds`).get()
          .then(snapshot => {
            snapshot.forEach(doc => {
              if (doc.exists) {

                return db.doc(`users/${uid}/feeds/${doc.data().id}`).delete()
                  .then(() => console.log('one feeds deleted'))
                  .catch(error => error);

              }
              return;
            })
          })
          .catch(error => error);

      })
      .then(() => {

        return db.doc(`users/${uid}`).delete()
          .then(() => console.log('user document deleted successfully'))
          .catch(error => error);

      })
      .then(() => {

        return db.collection(`photos`).where('owner.id', '==', `${uid}`).get()
          .then(snapshot => {
            snapshot.forEach(doc => {
              if (doc.exists) {

                const docId = doc.data().id as string;
                const photoStoragePath = doc.data().photo.storagePath as string;
                const photoThumStoragePath = doc.data().thumbnails.thum500.storagePath as string;

                return storage.bucket().file(photoStoragePath).delete()
                  .then(() => {

                    return storage.bucket().file(photoThumStoragePath).delete()
                      .then(() => console.log('thum deleted from storage'))
                      .catch(error => error);

                  })
                  .then(() => {

                    return db.doc(`photos/${docId}/views/views`).delete()
                      .then(() => console.log('views deleted successfully'))
                      .catch(error => error);

                  })
                  .then(() => {

                    return db.doc(`photos/${docId}/likes/likes`).delete()
                      .then(() => console.log('likes deleted successfully'))
                      .catch(error => error);

                  })
                  .then(() => {

                    return db.collection(`photos/${docId}/comments`).get()
                      .then(snap => {
                        snap.forEach(document => {
                          if (document.exists) {

                            const documentId = document.data().id as string;

                            return db.doc(`photos/${docId}/comments/${documentId}`).get()
                              .then(querySnapshot => {
                                if (querySnapshot.exists) {

                                  return db.collection(`photos/${docId}/comments/${documentId}/replays`).get()
                                    .then(snapshotDocs => {
                                      snapshotDocs.forEach(snapDoc => {

                                        const snapDocId = snapDoc.data().id as string;

                                        return db.doc(`photos/${docId}/comments/${documentId}/replays/${snapDocId}`).delete()
                                          .then(() => console.log('replay deleted successfully!'))
                                          .catch(error => error);

                                      });
                                    })
                                    .then(() => {
                                      return db.doc(`photos/${docId}/comments/${documentId}`).delete()
                                        .then(() => console.log('commets deleted successfully!'))
                                        .catch(error => error);
                                    })
                                    .catch(error => error);

                                }
                                return;
                              })
                              .catch(error => error);

                          }
                          return;
                        })
                      })
                      .catch(error => error);

                  })
                  .then(() => {

                    return db.doc(`photos/${docId}`).delete()
                      .then(() => console.log('photo document deleted successfully!'))
                      .catch(error => error);

                  })
                  .catch(error => error);
              }
              return;
            });
          })
          .then(() => {

            return db.collection(`jobs`).where('ownerId', '==', `${uid}`).get()
              .then(snapshot => {
                snapshot.forEach(doc => {
                  if (doc.exists) {

                    return db.doc(`jobs/${doc.data().id}`).delete()
                      .then(() => console.log('user jobs deleted successfully'))
                      .catch(error => error);

                  }
                  return;
                });
              })
              .catch(error => error);

          })
          .then(() => {

            return db.collection(`galleries`).where('owner.id', '==', `${uid}`).get()
              .then(snapshot => {
                snapshot.forEach(doc => {
                  if (doc.exists) {

                    return db.doc(`galleries/${doc.data().id}`).delete()
                      .then(() => console.log('user galleries deleted successfully'))
                      .catch(error => error);

                  }
                  return;
                });
              })
              .catch(error => error);

          })
          .catch(error => error);

      });
  });